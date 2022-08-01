import { useState, useEffect, useCallback } from 'react';
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

/**
 * Hook for the time it took to read pages so far.
 * @param  maxBufferLength - the maximum number of pages to consider when calculating the mean page time.
 * @param initBuffer - the initial record of page times.
 */
function usePageTimes(maxBufferLength: number, initBuffer: number[] = []) {
  const [buffer, setBuffer] = useState(initBuffer);
  const [maxPages, setMaxPages] = useState(maxBufferLength);

  /** Add a new page time to the buffer. */
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

/**
 * Hook implementing a pausible timer that runs a callback when finished.
 * @param initialTime - initial time on the clock.
 * @param cb - Callback executed when time runs out.
 */
function usePauseableTimer(initialTime = 0, cb: Function | null = null) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [callback, setCallback] = useState(() => cb);
  const [timePaused, setTimePaused] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(true);

  /** Get the remaining time in milliseconds. */
  const getTimeLeft = useCallback(() => {
    if (paused) return timeLeft;
    const timeRunning = startedAt ? Date.now() - startedAt : 0;
    return timeLeft - timeRunning;
  }, [paused, timeLeft, startedAt]);

  /** Updates the callback function that executes when the timer runs out. */
  useEffect(() => {
    if (!paused && callback && timeLeft > 0) {
      const timeLeft = getTimeLeft();
      const timer = setTimeout(callback, timeLeft);
      return () => clearTimeout(timer);
    }
  }, [callback, timeLeft, getTimeLeft, paused, startedAt]);

  /** Start the timer. */
  const start = useCallback(() => {
    const now = Date.now();
    const timeJustPaused = pausedAt ? now - pausedAt : 0;
    setTimePaused(t => t + timeJustPaused);
    setPaused(false);
    setStartedAt(now);
  }, [pausedAt]);

  /** Pause the timer. */
  const pause = useCallback(() => {
    setTimeLeft(getTimeLeft());
    setPaused(true);
    setPausedAt(Date.now());
  }, [getTimeLeft]);

  /**
   * Reset the timer.
   * @param newTime - time on the clock when reset.
   */
  const reset = useCallback((newTime = 0) => {
    setTimeLeft(newTime);
    setPaused(true);
    setTimePaused(0);
    setPausedAt(null);
  }, []);

  return {
    start,
    reset,
    pause,
    toggle: paused ? start : pause,
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
        <Button onClick={timer.toggle}>
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
