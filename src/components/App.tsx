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
import { usePageTimes } from '../hooks/useReading';

const bell = new Audio(bellSound);
const playBell = () => {
  if (!bell.paused) return (bell.currentTime = 0);
  return bell.play();
};

function PageCounter(props: {
  initialPage?: number;
  pageBuffer?: number;
  extraTime?: number;
}) {
  const { initialPage = 1, pageBuffer = 7, extraTime = 30000 } = props;
  console.log('updated!');

  const timer = usePauseableTimer(0, playBell);
  const [pageStart, setPageStart] = useState(Date.now());

  const pageTimes = usePageTimes(pageBuffer);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const pageTurn = () => {
    const now = Date.now();
    if (timer.active) {
      const timeSpentReading = now - pageStart - timer.timePaused;
      pageTimes.add(timeSpentReading);
      const nextPageTime = Math.ceil(pageTimes.median + extraTime);
      timer.reset(nextPageTime);
      timer.start();
      setPageStart(now);
      setCurrentPage(currentPage + 1);
    } else {
      if (currentPage === initialPage) {
        setPageStart(now);
      }
      timer.start();
    }
  };

  const displayText = timer.active
    ? `Current page: ${currentPage}`
    : 'Press anywhere to start';

  useEffect(() => {
    const checkInterval = setInterval(() => {
      console.log('time left: ', timer.timeLeft);
    }, 1000);
    return () => clearInterval(checkInterval);
  }, [timer]);

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
      {/*
      <Button
        size="large"
        onClick={}
        sx={{
          position: 'fixed',
          top: '1rem',
          left: 0,
        }}
      >
        <FontAwesomeIcon icon={faBars} />
      </Button>
      */}
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
          aria-label={timer.paused ? 'play' : 'pause'}
          onClick={timer.toggle}
        >
          <FontAwesomeIcon icon={timer.paused ? faPlay : faPause} />
        </IconButton>
        <IconButton aria-label="next page" onClick={pageTurn}>
          <FontAwesomeIcon icon={faForwardStep} />
        </IconButton>
      </Stack>
    </Container>
  );
}

function App() {
  return (
    <div className="App">
      <AppReadings />
    </div>
  );
  // return (
  //   <div className="App">
  //     <PageCounter extraTime={0} />
  //   </div>
  // );
}

export default App;
