import { Reading } from '../../types/common';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
import SaveReadingModal from './SaveReadingModal';

const AppReadingsList = ({
  readings,
  handleSelect,
  handleEdit,
  handleDelete,
}: {
  readings: Reading[];
  handleSelect: Function;
  handleEdit?: Function;
  handleDelete?: Function;
}) => (
  <List>
    {readings.map(reading => (
      <ListItem key={reading.id}>
        <ListItemButton onClick={() => handleSelect(reading)}>
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
        </ListItemButton>
        <ButtonGroup size="large">
          {handleEdit && (
            <Button aria-label="edit" onClick={() => handleEdit(reading)}>
              <FontAwesomeIcon icon={iconEdit} />
            </Button>
          )}
          {handleDelete && (
            <Button aria-label="delete" onClick={() => handleDelete(reading)}>
              <FontAwesomeIcon icon={iconDelete} />
            </Button>
          )}
        </ButtonGroup>
      </ListItem>
    ))}
  </List>
);

function AppReadings(props: { handleSelect: Function }) {
  const { handleSelect } = props;

  const [savedReadings, setSavedReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [formReading, setFormReading] = useState<Partial<Reading> | null>(null);

  useEffect(() => {
    updateReadings();
  }, []);

  const updateReadings = () =>
    db.getAll().then(result => {
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
    <Container>
      <Typography>Saved readings:</Typography>
      {isLoading ? (
        <Typography>Loading...</Typography>
      ) : (
        <AppReadingsList
          readings={savedReadings}
          handleSelect={handleSelect}
          handleEdit={openForm}
          handleDelete={deleteReading}
        />
      )}
      <Button onClick={() => openForm()}>New reading</Button>
      {formIsOpen && (
        <SaveReadingModal
          reading={formReading || undefined}
          isOpen={formIsOpen}
          close={closeForm}
          update={updateReadings}
        />
      )}
    </Container>
  );
}

export default AppReadings;
