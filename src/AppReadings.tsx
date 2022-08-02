import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
} from '@mui/material';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import {
//   IconDefinition,
//   faBars,
//   faFolderOpen,
//   faDownload,
// } from '@fortawesome/pro-solid-svg-icons';

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

function useDatabase(name: string, version: number) {
  const [db, setDb] = useState<IDBDatabase | undefined>();
  // const [request] = useState(indexedDB.open(name, version));
  // const [putRequest, setPutRequest] = useState<IDBRequest | undefined>();

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
      objectStore.createIndex('title', 'title', { unique: false });
      objectStore.createIndex('startPage', 'pages.start', { unique: false });
      objectStore.createIndex('endPage', 'pages.end', { unique: false });
      objectStore.createIndex('currentPage', 'pages.current', {
        unique: false,
      });
      objectStore.createIndex('history', 'pages.history', { unique: false });
    };

    request.addEventListener('success', onSuccess);
    request.addEventListener('error', onError);
    request.addEventListener('upgradeneeded', onUpgrade);
  }, [db, name, version]);

  return db;
}

interface ReadingHook extends Reading {
  nextPage: Function;
  previousPage: Function;
  save: Function;
}

// class Reading2 implements Reading {
//   title;
//   pages;
//   isSaved;
//   isCompleted;
//
//   constructor(options: Reading) {
//     const { title, pages } = options;
//
//     this.title = title;
//     this.pages = pages;
//     this.isSaved = false;
//     this.isCompleted = false;
//   }
//
//
// }

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

  const db = useDatabase('reading_aid', 1);
  const [queuedSave, setQueuedSave] = useState(false);

  const getId = useCallback(
    () => `${title} (${startPage}-${endPage || '?'})`,
    [title, startPage, endPage]
  );

  const save = useCallback(() => {
    if (!db) return setQueuedSave(true);
    const transaction = db.transaction(['readings'], 'readwrite');
    const objectStore = transaction.objectStore('readings');
    const request = objectStore.put(
      {
        title,
        pages: { start: startPage, end: endPage, current: currentPage },
      },
      getId()
    );
    request.addEventListener('success', () => {
      setIsSaved(true);
    });
    // TODO: more event listening...
  }, [db, title, startPage, endPage, currentPage, getId]);

  // run a queuedSave when the database is ready
  useEffect(() => {
    if (db && queuedSave) {
      save();
      setQueuedSave(false);
    }
  }, [db, save, queuedSave]);

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
    save,
  };
}

const AppReadingsList = ({ readings }: { readings: Reading[] }) => (
  <List>
    {readings.map(reading => (
      <ListItem>
        <ListItemText
          primary={reading.title}
          secondary={`Time remaining: (need to implement)`}
        />
      </ListItem>
    ))}
  </List>
);

const ReadingForm = (props: {
  isOpen: boolean;
  close: Function;
  update: Function;
}) => {
  // const [reading, setReading] = useState<Reading | undefined>()

  const reading = useReading();
  const [title, setTitle] = useState(reading.title);
  const [startPage, setStartPage] = useState(reading.pages.start);
  const [endPage, setEndPage] = useState(reading.pages.end);

  const configureReading = () => {
    reading.title = title;
    reading.pages.start = startPage;
    reading.pages.end = endPage;
    reading.save();
  };

  useEffect(() => props.update(true), [props, reading.isSaved]);

  return (
    <Dialog open={props.isOpen} onBackdropClick={() => props.close()}>
      <DialogTitle>New reading</DialogTitle>
      <DialogContent>
        <TextField
          id="new-title"
          label="Title"
          variant="standard"
          onChange={({ target }) => setTitle(target.value)}
        />
        <TextField
          id="new-page-start"
          label="First page"
          type="number"
          defaultValue={1}
          variant="standard"
          onChange={({ target }) => setStartPage(Number(target.value))}
        />
        <TextField
          id="new-page-end"
          label="Last page"
          type="number"
          variant="standard"
          onChange={({ target }) => setEndPage(Number(target.value))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => configureReading()}>Submit</Button>
        <Button onClick={() => props.close()}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

function AppReadings() {
  const [savedReadings, setSavedReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formIsOpen, setFormIsOpen] = useState(false);

  const db = useDatabase('reading_aid', 1);

  useEffect(() => {
    if (!db) return;
    const transaction = db.transaction(['readings'], 'readonly');
    const objectStore = transaction.objectStore('readings');
    const request = objectStore.getAll(); // TODO handle max-events, requery on later requests
    request.addEventListener('success', () => {
      setSavedReadings(request.result);
      setIsLoading(false);
    });
  }, [db, isLoading]);

  const openForm = () => setFormIsOpen(true);
  const closeForm = () => setFormIsOpen(false);
  const toggleForm = () => setFormIsOpen(!formIsOpen);

  return (
    <Box>
      <Typography>Saved readings:</Typography>
      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <AppReadingsList readings={savedReadings} />
      )}
      <Button onClick={openForm}>New reading</Button>
      <ReadingForm
        isOpen={formIsOpen}
        close={closeForm}
        update={setIsLoading}
      />
    </Box>
  );
}

export default AppReadings;
