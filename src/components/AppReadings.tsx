import { Reading } from '../../types/common';

import { useState, useEffect } from 'react';
import {
  Box,
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

import db from '../services/Database';
import { useReading } from '../hooks/useReading';

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
  reading?: Partial<Reading>;
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
  const [formReading, setFormReading] = useState<Partial<Reading> | null>(null);

  useEffect(() => {
    updateReadings();
  }, []);

  console.log('querying');
  db.get('foobar').then(console.log);

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

  const openForm = (reading?: Partial<Reading>) => {
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