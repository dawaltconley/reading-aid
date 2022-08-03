import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Stack,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  ButtonGroup,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare as iconEdit,
  faTrashCan as iconDelete,
} from '@fortawesome/pro-solid-svg-icons';
import _ from 'lodash';
import { openDB, IDBPDatabase } from 'idb';

interface Reading {
  readonly id?: string;
  title?: string;
  pages: {
    start: number;
    end?: number;
    current?: number;
    // history: number[];
  };
  readonly isSaved: boolean;
  readonly isCompleted: boolean;
}

const openDatabase = openDB('reading_aid', 1, {
  upgrade(db, oldVersion) {
    switch (oldVersion) {
      case 0: {
        const objectStore = db.createObjectStore('readings', {
          keyPath: 'id',
        });
        objectStore.createIndex('id', 'id', { unique: true });
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('startPage', 'pages.start', { unique: false });
        objectStore.createIndex('endPage', 'pages.end', { unique: false });
        objectStore.createIndex('currentPage', 'pages.current', {
          unique: false,
        });
      }
    }
  },
});

class Database {
  private db: Promise<IDBPDatabase>;
  readonly store: string;

  constructor(name: string, version: number, store: string) {
    this.store = store;
    this.db = openDB(name, version, {
      upgrade(db, oldVersion) {
        const generic = { unique: false };
        switch (oldVersion) {
          case 0: {
            const objectStore = db.createObjectStore(store, {
              keyPath: 'id',
            });
            objectStore.createIndex('id', 'id', { unique: true });
            objectStore.createIndex('title', 'title', generic);
            objectStore.createIndex('startPage', 'pages.start', generic);
            objectStore.createIndex('endPage', 'pages.end', generic);
            objectStore.createIndex('currentPage', 'pages.current', generic);
            objectStore.createIndex('pageBuffer', 'pages.buffer', generic);
            objectStore.createIndex('dateCreated', 'dateCreated', generic);
            objectStore.createIndex('dateModified', 'dateModified', generic);
            objectStore.createIndex('isCompleted', 'isCompleted', generic);
          }
        }
      },
    });
  }

  async update(reading: ReadingData) {
    const db = await this.db;
    return db.put(this.store, reading).then(e => console.log('object key', e));
  }

  async delete(id: string) {
    const db = await this.db;
    return db.delete(this.store, id);
  }

  async get(query: IDBKeyRange | string) {
    const db = await this.db;
    return db.get(this.store, query);
  }

  async getAll(query?: IDBKeyRange | string | null) {
    const db = await this.db;
    return db.getAll(this.store, query);
  }
}

const db = new Database('reading_aid', 1, 'readings');

interface ReadingHook extends ReadingData {
  nextPage: () => void;
  previousPage: () => void;
  save: Function;
  delete: Function;
}

interface ReadingData {
  id: string;
  title: string;
  pages: {
    start: number;
    end?: number;
    current: number; // change separately from state
    buffer: number[];
  };
  dateCreated: Date;
  dateModified: Date;
  isCompleted: boolean;
  isSaved?: boolean; // don't need to save this value
}

function useReading(options: Partial<ReadingData> = {}) {
  const [data, setData] = useState(
    _.merge(
      {
        pages: { start: 1, current: 1, buffer: [] },
        isSaved: false,
        isCompleted: false,
      },
      options
    )
  );
  const [currentPage, setCurrentPage] = useState(data.pages?.current || 1);
  const [isSaved, setIsSaved] = useState(options.isSaved);
  const [isCompleted, setIsCompleted] = useState(options.isCompleted);

  const saveReading = async (
    updates: Partial<ReadingData> & { title: string }
  ) => {
    const now = new Date();
    const defaults = {
      id: updates.title + ' ' + now.getTime().toString(),
      pages: {
        start: 1,
        buffer: [],
      },
      dateCreated: now,
      isCompleted: false,
    };
    const updated: ReadingData = _.merge(defaults, data, updates, {
      pages: { current: currentPage },
      dateModified: now,
    });
    db.update({ ...updated, isSaved: true }).then(() => {
      setData(old => _.merge(old, updated));
      setIsSaved(true);
    });
  };

  const deleteReading = () =>
    isSaved && data.id && db.delete(data.id).then(() => setIsSaved(false));

  const nextPage = () => {
    const next = currentPage + 1;
    const end = data.pages?.end;
    if (end && next > end) setIsCompleted(true);
    else setCurrentPage(next);
  };

  const previousPage = () => {
    setCurrentPage(currentPage - 1 || 1);
  };

  return {
    ...data,
    nextPage,
    previousPage,
    save: saveReading,
    delete: deleteReading,
  };
}

const AppReadingsList = ({
  readings,
  handleEdit,
  handleDelete,
}: {
  readings: Reading[];
  handleEdit?: Function;
  handleDelete?: Function;
}) => (
  <List>
    {readings.map(reading => (
      <ListItem key={reading.id}>
        <ListItemText
          primary={reading.title}
          secondary={
            <span>
              {`pp. ${reading.pages.start}-${reading.pages.end || ''}`}
              <br />
              {`Time remaining: (need to implement)`}
            </span>
          }
        />
        {handleEdit && (
          <IconButton aria-label="edit" onClick={() => handleEdit(reading)}>
            <FontAwesomeIcon icon={iconEdit} />
          </IconButton>
        )}
        {handleDelete && (
          <IconButton aria-label="delete" onClick={() => handleDelete(reading)}>
            <FontAwesomeIcon icon={iconDelete} />
          </IconButton>
        )}
      </ListItem>
    ))}
  </List>
);

const ReadingForm = ({
  reading: loadReading,
  isOpen,
  close,
  update,
}: {
  reading?: Partial<ReadingData>;
  isOpen: boolean;
  close: Function;
  update: Function;
}) => {
  const reading = useReading(loadReading);
  const [title, setTitle] = useState(reading.title);
  const [startPage, setStartPage] = useState(reading.pages.start);
  const [endPage, setEndPage] = useState(reading.pages.end);

  console.log('rendering form');
  console.log({ title, startPage, endPage });

  const handleSubmit = () => {
    if (!title) throw new Error('title is required');
    reading
      .save({
        title: title,
        pages: {
          ...reading.pages, // may not want this, just a DeepPartial: https://stackoverflow.com/questions/61132262/typescript-deep-partial
          start: startPage,
          end: endPage,
        },
      })
      .then(() => {
        update();
        close();
      });
  };

  return (
    <Dialog open={isOpen} onBackdropClick={() => close()}>
      <DialogTitle>New reading</DialogTitle>
      <DialogContent>
        <TextField
          id="new-title"
          label="Title"
          required
          variant="standard"
          defaultValue={title}
          onChange={({ target }) => setTitle(target.value)}
        />
        <TextField
          id="new-page-start"
          label="First page"
          required
          type="number"
          variant="standard"
          defaultValue={startPage}
          onChange={({ target }) => setStartPage(Number(target.value))}
        />
        <TextField
          id="new-page-end"
          label="Last page"
          type="number"
          variant="standard"
          defaultValue={endPage}
          onChange={({ target }) => setEndPage(Number(target.value))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleSubmit()}>Submit</Button>
        <Button onClick={() => close()}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

function AppReadings() {
  const [savedReadings, setSavedReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [formReading, setFormReading] = useState<Partial<ReadingData> | null>(
    null
  );

  useEffect(() => {
    updateReadings();
  }, []);

  const updateReadings = () =>
    db.getAll().then(result => {
      console.log({ result });
      const lastModified = result.sort(
        (a, b) => b.dateModified.getTime() - a.dateModified.getTime()
      );
      setSavedReadings(lastModified);
    });
  const deleteReading = (reading: Reading) =>
    reading.id && db.delete(reading.id).then(updateReadings);

  const openForm = (reading?: Partial<ReadingData>) => {
    console.log('opening reading', reading);
    setFormReading(reading || null);
    setFormIsOpen(true);
  };
  const closeForm = () => {
    setFormIsOpen(false);
    setFormReading(null);
  };

  return (
    <Box>
      <Typography>Saved readings:</Typography>
      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <AppReadingsList
          readings={savedReadings}
          handleEdit={openForm}
          handleDelete={deleteReading}
        />
      )}
      <Button onClick={() => openForm()}>New reading</Button>
      {formIsOpen && (
        <ReadingForm
          reading={formReading || undefined}
          isOpen={formIsOpen}
          close={closeForm}
          update={updateReadings}
        />
      )}
    </Box>
  );
}

export default AppReadings;
