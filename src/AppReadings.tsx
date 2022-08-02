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

let dbInstance = 0;
function useDatabase(name: string = 'reading_aid', version: number = 1) {
  const [db, setDb] = useState<IDBDatabase | undefined>();
  const [queued, setQueued] = useState<Function[]>([]);

  const addToQueue = (...functions: Function[]) =>
    setQueued([...queued, ...functions]);

  const getDatabase = (): Promise<IDBDatabase> =>
    db
      ? Promise.resolve(db)
      : new Promise(resolve => {
          addToQueue((db: IDBDatabase) => resolve(db));
        });

  useEffect(() => {
    if (!db || !queued.length) return;
    queued.forEach(q => q(db));
    setQueued([]);
  }, [db, queued]);

  useEffect(() => {
    if (db) return () => db.close();

    const request = indexedDB.open(name, version);
    const onSuccess = () => setDb(request.result);
    const onError = () => console.error('Could not open database');
    const onUpgrade = () => {
      const db = request.result;

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
      // objectStore.createIndex('history', 'pages.history', { unique: false });
    };

    request.addEventListener('success', onSuccess);
    request.addEventListener('error', onError);
    request.addEventListener('upgradeneeded', onUpgrade);
  }, [db, name, version]);

  // type MakeRequest = {
  //   // (method: 'put', value: any, key?: string | undefined): Promise<IDBRequest>;
  //   (method: 'delete', query: IDBKeyRange | string): Promise<IDBRequest>;
  // };
  //
  // const makeRequest: MakeRequest = async (
  //   method, // | 'get' | 'getAll',
  //   ...args
  // ): Promise<IDBRequest> => {
  //   const readWrite = ['put', 'delete'];
  //   const argumentLength = {
  //     put: 2,
  //     delete: 1,
  //     get: 1,
  //     getAll: 2,
  //   };
  //   const mode = ['put', 'delete'].includes(method) ? 'readwrite' : 'readonly';
  //   const db = await getDatabase();
  //   const transaction = db.transaction(['readings'], mode);
  //   const objectStore = transaction.objectStore('readings');
  //   // const request = objectStore[method].apply(objectStore, args);
  //   console.log(args);
  //   const o = objectStore[method];
  //   const request = objectStore[method].apply(objectStore, args);
  //   return request;
  // };

  const promisify;

  const putReading = async (
    reading: Reading,
    callback?: (e: Event) => void
  ) => {
    const db = await getDatabase();
    const transaction = db.transaction(['readings'], 'readwrite');
    const objectStore = transaction.objectStore('readings');
    const request = objectStore.put(reading);
    request.addEventListener('success', event => {
      if (callback) callback(event);
    });
    // TODO: more event listening...
  };

  const deleteReading = async (id: string, callback?: (e: Event) => void) => {
    const db = await getDatabase();
    const transaction = db.transaction(['readings'], 'readwrite');
    const objectStore = transaction.objectStore('readings');
    const request = objectStore.delete(id);
    request.addEventListener('success', event => {
      if (callback) callback(event);
    });
  };

  const getAllReadings = async (
    query: IDBKeyRange | string | null | undefined,
    callback?: (e: Reading[]) => void
  ) => {
    const db = await getDatabase();
    const transaction = db.transaction(['readings'], 'readonly');
    const objectStore = transaction.objectStore('readings');
    const request = objectStore.getAll(query); // TODO handle max-events, requery on later requests
    request.addEventListener('success', () => {
      if (callback) callback(request.result);
    });
    // request.addEventListener('error', e =>
    //   console.error(`Couldn't get readings`, e)
    // );
  };

  return {
    update: putReading,
    delete: deleteReading,
    getAll: getAllReadings,
  };
}

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

  const db = useDatabase();
  const [queued, setQueued] = useState<string | false>(false);

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

  const saveReading = (
    updates: Partial<Reading>,
    callback?: (e: Event) => void
  ) => {
    const updated: Reading = _.merge(data, updates);
    db.update({ ..._.merge(data, updates), isSaved: true }, event => {
      // TODO update state after / during save
      setIsSaved(true);
      if (callback) callback(event);
    });
  };

  // const getReading = (
  //   callback?: (e: Event) => void
  // ) => {
  //
  // }

  // const saveReading = (callback?: (e: Event) => void) => {
  //   console.log('saveReading', { title, startPage, endPage, currentPage });
  //   db.update(
  //     {
  //       id: getId(), // I may want to do something different here, in order to not create new entries when editing the pages
  //       title,
  //       pages: { start: startPage, end: endPage, current: currentPage },
  //       isSaved: true,
  //       isCompleted,
  //     },
  //     event => {
  //       setIsSaved(true);
  //       if (callback) callback(event);
  //     }
  //   );
  // };

  const deleteReading = (callback?: (e: Event) => void) =>
    db.delete(getId(), event => {
      setIsSaved(false);
      if (callback) callback(event);
    });

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
    reading.save(
      {
        title: title,
        pages: {
          start: startPage,
          end: endPage,
        },
      },
      () => {
        update();
        close();
      }
    );
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

  const db = useDatabase();

  useEffect(() => {
    updateReadings();
    // db.getAll(null, result => {
    //   setSavedReadings(result);
    //   setIsLoading(false);
    // });
  }, []);

  const updateReadings = () =>
    db.getAll(null, result => setSavedReadings(result));
  const deleteReading = (reading: Reading) =>
    reading.id && db.delete(reading.id, updateReadings);

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
