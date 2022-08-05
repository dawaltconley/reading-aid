import { Reading, ReadingPartial } from '../../types/common';
import { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  TextField,
} from '@mui/material';

import { useReading } from '../hooks/useReading';

export default function SaveReadingModal({
  reading: loadReading,
  isOpen,
  close,
  update,
}: {
  reading?: ReadingPartial;
  isOpen: boolean;
  close: Function;
  update: Function;
}) {
  const reading = useReading(loadReading);
  const [title, setTitle] = useState(reading.title);
  const [titleError, setTitleError] = useState(false);
  const [startPage, setStartPage] = useState(reading.pages.start);
  const [endPage, setEndPage] = useState(reading.pages.end);
  const [currentPage, setCurrentPage] = useState(reading.pages.current);

  const handleSubmit = () => {
    if (!title) throw new Error('title is required');
    reading
      .update({
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
  };

  const validTitle: boolean = !!title;
  const validStartPage: boolean =
    !!startPage &&
    startPage > 0 &&
    startPage <= currentPage &&
    (!endPage || startPage <= endPage);
  const validEndPage: boolean =
    !endPage || (endPage >= currentPage && endPage >= startPage);
  const validCurrentPage: boolean =
    !!currentPage &&
    currentPage >= startPage &&
    (!endPage || currentPage <= endPage);

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
          autoFocus={!title}
          error={!validTitle}
          onChange={({ target }) => setTitle(target.value)}
        />
        <TextField
          id="new-page-start"
          label="First page"
          required
          type="number"
          variant="standard"
          value={startPage}
          error={!validStartPage}
          onChange={({ target }) => setStartPage(Number(target.value))}
        />
        <TextField
          id="new-page-current"
          label="Current page"
          required
          type="number"
          variant="standard"
          value={currentPage}
          error={!validCurrentPage}
          onChange={({ target }) => setCurrentPage(Number(target.value))}
        />
        <TextField
          id="new-page-end"
          label="Last page"
          type="number"
          variant="standard"
          value={endPage}
          error={!validEndPage}
          onChange={({ target }) => setEndPage(Number(target.value))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleSubmit()}>Submit</Button>
        <Button onClick={() => close()}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
