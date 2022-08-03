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
        switch (oldVersion) {
          case 0: {
            const objectStore = db.createObjectStore(store, {
              keyPath: 'id',
            });
            objectStore.createIndex('id', 'id', { unique: true });
            objectStore.createIndex('title', 'title', { unique: false });
            objectStore.createIndex('startPage', 'pages.start', {
              unique: false,
            });
            objectStore.createIndex('endPage', 'pages.end', { unique: false });
            objectStore.createIndex('currentPage', 'pages.current', {
              unique: false,
            });
          }
        }
      },
    });
  }

  async update(reading: Reading) {
    const db = await this.db;
    return db.put(this.store, reading);
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

interface ReadingHook extends Reading {
  nextPage: () => void;
  previousPage: () => void;
  save: Function;
  delete: Function;
}

function useReading(
  options: Reading = {
    pages: {
      start: 1,
      // history: [],
    },
    isSaved: false,
    isCompleted: false,
  }
): ReadingHook {
  const [title, setTitle] = useState(options.title);
  const [startPage, setStartPage] = useState(options.pages.start);
  const [endPage, setEndPage] = useState(options.pages.end);
  const [currentPage, setCurrentPage] = useState(options.pages.start);
  const [isSaved, setIsSaved] = useState(options.isSaved);
  const [isCompleted, setIsCompleted] = useState(options.isCompleted);

  const getId = useCallback(
    () => `${title} (${startPage}-${endPage || '?'})`,
    [title, startPage, endPage]
  );

  const data: Reading = {
    get id() {
      return getId();
    },
    title,
    pages: {
      start: startPage,
      end: endPage,
      current: currentPage,
    },
    isSaved,
    isCompleted,
  };

  const saveReading = async (updates: Partial<Reading>) => {
    const updated: Reading = _.merge(data, updates);
    db.update({ ..._.merge(data, updates), isSaved: true }).then(() => {
      // TODO update state after / during save
      setIsSaved(true);
    });
  };

  // const getReading = (
  //   callback?: (e: Event) => void
  // ) => {
  //
  // }

  const deleteReading = () => db.delete(getId()).then(() => setIsSaved(false));

  const nextPage = () => {
    const next = currentPage + 1;
    if (endPage && next > endPage) setIsCompleted(true);
    else setCurrentPage(next);
  };

  const previousPage = () => {
    setCurrentPage(currentPage - 1 || 1);
  };

  const pages = {
    get start() {
      console.log('getting start');
      return startPage;
    },
    set start(n) {
      console.log('setting start', n);
      setStartPage(n);
    },
    get end() {
      return endPage;
    },
    set end(n) {
      console.log('setting end', n);
      setEndPage(n);
    },
    get current() {
      return currentPage;
    },
    set current(n) {
      setCurrentPage(n);
    },
  };

  console.log('reading render', { title, pages });

  return {
    get title() {
      return title;
    },
    set title(s) {
      console.log('setting title', s);
      setTitle(s);
    },
    pages,
    isSaved,
    isCompleted,
    get id() {
      return getId();
    },
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
  reading?: Reading;
  isOpen: boolean;
  close: Function;
  update: Function;
}) => {
  // const [reading, setReading] = useState<Reading | undefined>()

  const reading = useReading(loadReading);
  const [title, setTitle] = useState(reading.title);
  const [startPage, setStartPage] = useState(reading.pages.start);
  const [endPage, setEndPage] = useState(reading.pages.end);

  // console.log('rendering form');
  // console.log({ title, startPage, endPage });

  const configureReading = () => {
    reading
      .save({
        title: title,
        pages: {
          start: startPage,
          end: endPage,
        },
      })
      .then(() => {
        update();
        close();
      });
    // console.log('abt to save');
    // console.log({ title, startPage, endPage });
    // reading.title = title;
    // reading.pages.start = startPage;
    // reading.pages.end = endPage;
    // console.log('saving as...');
    // console.log({
    //   title: reading.title,
    //   startPage: reading.pages.start,
    //   endPage: reading.pages.end,
    // });
    // reading.save(() => {
    //   update();
    //   close();
    // });
  };

  // this causes an infinite loop
  // useEffect(() => update(true), [update, reading.isSaved]);

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
        <Button onClick={() => configureReading()}>Submit</Button>
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
  const [formReading, setFormReading] = useState<Reading | null>(null);

  useEffect(() => {
    updateReadings();
  }, []);

  const updateReadings = () =>
    db.getAll().then(result => setSavedReadings(result));
  const deleteReading = (reading: Reading) =>
    reading.id && db.delete(reading.id).then(updateReadings);

  const openForm = (reading?: Reading) => {
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
