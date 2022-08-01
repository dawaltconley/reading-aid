import React, { useState, useEffect } from 'react';
import {
  // Box,
  Container,
  // Stack,
  Typography,
  Button,
  ButtonGroup,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faForwardStep,
  faBackwardStep,
} from '@fortawesome/pro-solid-svg-icons';

import bellSound from './assets/bell.mp3';
import './App.css';

const bell = new Audio(bellSound);
const playBell = () => {
  if (!bell.paused) return (bell.currentTime = 0);
  return bell.play();
};

function usePageTimes(maxBufferLength: number, initBuffer: number[] = []) {
  const [buffer, setBuffer] = useState(initBuffer);
  const [maxPages, setMaxPages] = useState(maxBufferLength);

  const add = (newTime: number) => {
    buffer.push(newTime);
    setBuffer(buffer);
  };

  return {
    buffer,
    add,
    set maxPages(n) {
      setMaxPages(n);
    },
    get maxPages() {
      return maxPages;
    },
    get sorted() {
      const recent = maxPages ? buffer.slice(maxPages * -1) : [...buffer];
      return recent.sort((a, b) => a - b);
    },
    get median() {
      // const sorted = getSorted(maxPages);
      const sorted = this.sorted;
      const middle = (sorted.length - 1) / 2;
      if (Number.isInteger(middle)) {
        return sorted[middle];
      } else {
        const low = Math.floor(middle),
          high = Math.ceil(middle);
        return (sorted[low] + sorted[high]) / 2;
      }
    },
  };
}

function usePauseableTimer(initialTime = 0, cb: Function | null = null) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [callback, setCallback] = useState(() => cb);
  const [timePaused, setTimePaused] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    if (!paused && callback && timeLeft > 0) {
      const timeLeft = getTimeLeft();
      const timer = setTimeout(callback, timeLeft);
      return () => clearTimeout(timer);
    }
  }, [callback, timeLeft, paused, startedAt]);

  const getTimeLeft = () => {
    if (paused) return timeLeft;
    const timeRunning = startedAt ? Date.now() - startedAt : 0;
    return timeLeft - timeRunning;
  };

  const start = () => {
    const now = Date.now();
    const timeJustPaused = pausedAt ? now - pausedAt : 0;
    setTimePaused(t => t + timeJustPaused);
    setPaused(false);
    setStartedAt(now);
  };

  const pause = () => {
    setTimeLeft(getTimeLeft());
    setPaused(true);
    setPausedAt(Date.now());
  };

  const reset = (newTime = 0) => {
    setTimeLeft(newTime);
    setPaused(true);
    setTimePaused(0);
    setPausedAt(null);
  };

  return {
    start,
    reset,
    pause,
    paused,
    active: !paused,
    get callback() {
      return callback;
    },
    set callback(cb) {
      setCallback(() => cb);
    },
    get timeLeft() {
      return getTimeLeft();
    },
    timePaused,
  };
}

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
      <Typography>{displayText}</Typography>
      <ButtonGroup variant="text" size="large">
        <Button onClick={() => console.log('not yet implemented!')}>
          <FontAwesomeIcon icon={faBackwardStep} />
        </Button>
        <Button onClick={timer.paused ? timer.start : timer.pause}>
          <FontAwesomeIcon icon={timer.paused ? faPlay : faPause} />
        </Button>
        <Button onClick={pageTurn}>
          <FontAwesomeIcon icon={faForwardStep} />
        </Button>
      </ButtonGroup>
    </Container>
  );
}

function App() {
  return (
    <div className="App">
      <PageCounter extraTime={0} />
    </div>
  );
}

export default App;
