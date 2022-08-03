import { useState, useEffect, useCallback } from 'react';
import {
  // Box,
  Container,
  Stack,
  Typography,
  // Button,
  IconButton,
  // ButtonGroup,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faForwardStep,
  faBackwardStep,
} from '@fortawesome/pro-solid-svg-icons';

import bellSound from '../assets/bell.mp3';
import './App.css';

import AppMenu from './AppMenu';
import AppReadings from './AppReadings';
import { usePauseableTimer } from '../hooks/usePauseableTimer';
import { useReading, useActiveReading } from '../hooks/useReading';

const bell = new Audio(bellSound);
const playBell = () => {
  if (!bell.paused) return (bell.currentTime = 0);
  return bell.play();
};

function PageCounter() {
  const reading = useActiveReading({}, { timeUpCallback: playBell });

  const displayText = reading.active
    ? `Current page: ${reading.pages.current}`
    : 'Press anywhere to start';

  useEffect(() => {
    const checkInterval = setInterval(() => {
      console.log('time left: ', reading.timeLeft);
      console.log('time running: ', reading.timeRunning);
    }, 1000);
    return () => clearInterval(checkInterval);
  }, [reading]);

  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <AppMenu open={false} />
      <Typography>{displayText}</Typography>
      <Stack direction="row">
        <IconButton
          aria-label="previous page"
          onClick={() => console.log('not yet implemented!')}
        >
          <FontAwesomeIcon icon={faBackwardStep} />
        </IconButton>
        <IconButton
          aria-label={reading.paused ? 'play' : 'pause'}
          onClick={reading.paused ? reading.start : reading.pause}
        >
          <FontAwesomeIcon icon={reading.paused ? faPlay : faPause} />
        </IconButton>
        <IconButton aria-label="next page" onClick={reading.nextPage}>
          <FontAwesomeIcon icon={faForwardStep} />
        </IconButton>
      </Stack>
    </Container>
  );
}

function App() {
  // return (
  //   <div className="App">
  //     <AppReadings />
  //   </div>
  // );
  return (
    <div className="App">
      <PageCounter />
    </div>
  );
}

export default App;
