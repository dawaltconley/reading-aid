import { useState, useEffect, useCallback } from 'react';
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
  id?: string;
  title?: string;
  pages: {
    start: number;
    end?: number;
    current?: number;
    // history: number[];
  };
  isSaved: boolean;
  isCompleted: boolean;
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

  const db = useDatabase('reading_aid', 1);
  const [queuedSave, setQueuedSave] = useState<Reading | undefined>();

  const save = useCallback(
    (reading: Reading) => {
      if (!db) return;
      const transaction = db.transaction(['readings'], 'readwrite');
      const objectStore = transaction.objectStore('readings');
      const putRequest = objectStore.put(
        {
          title,
          page: {},
        },
        getId()
      );
      putRequest.addEventListener('success', () => {
        setIsSaved(true);
      });
      // TODO: more event listening...
    },
    [db]
  );

  useEffect(() => {
    if (db && queuedSave) {
      save(queuedSave);
      setQueuedSave(undefined);
    }
  }, [db, save, queuedSave]);

  const getId = () => `${title} (${startPage}-${endPage || '?'})`;

  const nextPage = () => {
    const next = currentPage + 1;
    if (endPage && next > endPage) setIsCompleted(true);
    else setCurrentPage(next);
  };

  const previousPage = () => {
    setCurrentPage(currentPage - 1 || 1);
  };

  return {
    title,
    pages: {
      start: startPage,
      end: endPage,
      current: currentPage,
    },
    isSaved,
    isCompleted,
    get id() {
      return getId();
    },
    nextPage,
    previousPage,
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

const ReadingForm = (props: { isOpen: boolean; close: Function }) => {
  // const [reading, setReading] = useState<Reading | undefined>()

  const reading = useReading()
  

  return (
    <Dialog open={props.isOpen} onBackdropClick={() => props.close()}>
      <DialogTitle>New reading</DialogTitle>
      <DialogContent>
        <TextField id="new-title" label="Title" variant="standard" />
        <TextField
          id="new-page-start"
          label="First page"
          type="number"
          defaultValue={1}
          variant="standard"
        />
        <TextField
          id="new-page-end"
          label="Last page"
          type="number"
          variant="standard"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.close()}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

function AppReadings() {
  const [savedReadings, setSavedReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  }, [db]);

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
      <ReadingForm isOpen={formIsOpen} close={closeForm} />
    </Box>
  );
}

export default AppReadings;
