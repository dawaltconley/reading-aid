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
  // const [renderCount, setRenderCount] = useState(0)
  const renderRef = useRef(0);
  const instance = useRef(dbInstance++);
  // console.log('total db', instance.current);

  console.log({ db });

  const addToQueue = useCallback(
    (...args: Function[]) => {
      console.log('adding to queue');
      let q = [...queued, ...args];
      console.log('new queue: ', q);
      setQueued(q);
    },
    [queued]
  );

  useEffect(() => {
    // renderRef.current++;
    // console.log('database changed', renderRef.current);
    // console.log({ db });

    // addToQueue(() => console.log('dummy queue executed'));
    // console.log('added logger function', instance.current);

    if (db) return () => db.close();
    // if (db) return;

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

  const putReading = (reading: Reading, callback?: (e: Event) => void) => {
    if (!db) return addToQueue(() => putReading(reading, callback));
    const transaction = db.transaction(['readings'], 'readwrite');
    const objectStore = transaction.objectStore('readings');
    const request = objectStore.put(reading);
    request.addEventListener('success', event => {
      if (callback) callback(event);
    });
    // TODO: more event listening...
  };

  const deleteReading = (id: string, callback?: (e: Event) => void) => {
    if (!db) return addToQueue(() => deleteReading(id, callback));
    const transaction = db.transaction(['readings'], 'readwrite');
    const objectStore = transaction.objectStore('readings');
    const request = objectStore.delete(id);
    request.addEventListener('success', event => {
      if (callback) callback(event);
    });
  };

  function getAllReadings(
    query: IDBKeyRange | string | null | undefined,
    callback?: (e: Reading[]) => void
  ): void {
    // addToQueue(() => console.log('dummy queue executed'));
    // console.log('added logger function', instance.current);
    console.log('getting all readings', db);
    if (!db)
      return addToQueue(
        () => console.log('dummy queue executed'),
        getAllReadings.bind(null, query, callback)
      );
    const transaction = db.transaction(['readings'], 'readonly');
    const objectStore = transaction.objectStore('readings');
    const request = objectStore.getAll(/* query */); // TODO handle max-events, requery on later requests
    console.log({ request });
    request.addEventListener('success', () => {
      console.log('got all readings', request.result);
      if (callback) callback(request.result);
    });
    request.addEventListener('error', e =>
      console.error(`Couldn't get readings`, e)
    );
  }

  //   },
  //   [db, addToQueue]
  // );
  // const getAllReadings = // useCallback(
  //   (
  //     query: IDBKeyRange | string | null | undefined,
  //     callback?: (e: Reading[]) => void
  //   ) => {
  //     // addToQueue(() => console.log('dummy queue executed'));
  //     // console.log('added logger function', instance.current);
  //     if (!db)
  //       return addToQueue(
  //         () => console.log('dummy queue executed'),
  //         () => getAllReadings(query, callback)
  //       );
  //     const transaction = db.transaction(['readings'], 'readonly');
  //     const objectStore = transaction.objectStore('readings');
  //     const request = objectStore.getAll(/* query */); // TODO handle max-events, requery on later requests
  //     console.log({ request });
  //     request.addEventListener('success', () => {
  //       console.log('got all readings', request.result);
  //       if (callback) callback(request.result);
  //     });
  //     request.addEventListener('error', e =>
  //       console.error(`Couldn't get readings`, e)
  //     );
  //   };
  // //   },
  // //   [db, addToQueue]
  // // );

  useEffect(() => {
    console.log({ db, queued });
    if (!db || !queued.length) return;
    console.log('executing entire queue', instance.current, queued);
    queued.forEach(q => {
      console.log('executing...', q);
      q();
    });
    setQueued([]);
  }, [db, queued]);

  return { update: putReading, delete: deleteReading, getAll: getAllReadings };
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

  const saveReading = (callback?: (e: Event) => void) =>
    db.update(
      {
        id: getId(), // I may want to do something different here, in order to not create new entries when editing the pages
        title,
        pages: { start: startPage, end: endPage, current: currentPage },
        isSaved: true,
        isCompleted,
      },
      event => {
        setIsSaved(true);
        if (callback) callback(event);
      }
    );

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
      return startPage;
    },
    set start(n) {
      setStartPage(n);
    },
    get end() {
      return endPage;
    },
    set end(n) {
      setEndPage(n);
    },
    get current() {
      return currentPage;
    },
    set current(n) {
      setCurrentPage(n);
    },
  };

  return {
    get title() {
      return title;
    },
    set title(s) {
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
  console.log('rendering form');
  console.log(reading);
  const [title, setTitle] = useState(reading.title);
  const [startPage, setStartPage] = useState(reading.pages.start);
  const [endPage, setEndPage] = useState(reading.pages.end);

  const configureReading = () => {
    reading.title = title;
    reading.pages.start = startPage;
    reading.pages.end = endPage;
    reading.save(() => {
      update(true);
      close();
    });
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [formReading, setFormReading] = useState<Reading | null>(null);

  console.log('re-rendering AppReadings');
  console.log({ savedReadings, isLoading, isSaving, formIsOpen, formReading });

  const db = useDatabase();

  useEffect(() => {
    console.log('effect attempting getAll');
    db.getAll(null, result => {
      console.log('db results');
      console.log({ result });
      setSavedReadings(result);
      setIsLoading(false);
    });
  }, []);

  const openForm = (reading?: Reading) => {
    console.log('opening reading', reading);
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
        <AppReadingsList readings={savedReadings} handleEdit={openForm} />
      )}
      <Button onClick={() => openForm()}>New reading</Button>
      <ReadingForm
        reading={formReading || undefined}
        isOpen={formIsOpen}
        close={closeForm}
        update={setIsLoading}
      />
    </Box>
  );
}

export default AppReadings;
