import { ReadingActive } from '../../types/common';

import { useEffect, useContext } from 'react';
import {
  Container,
  Stack,
  Typography,
  IconButton,
  SvgIcon,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faForwardStep,
  faBackwardStep,
} from '@fortawesome/pro-solid-svg-icons';

import { useActiveReading } from '../hooks/useReading';
import ActiveReading from '../context/ActiveReading';
import bellSound from '../assets/bell.mp3';

/** format milliseconds as a human-readable string */
const formatTime = (milliseconds: number): string => {
  let seconds = Math.ceil(milliseconds / 1000);
  let s = seconds % 60;
  let m = ((seconds -= s) % 3600) / 60;
  let h = (seconds -= m * 60) / 3600;
  let formatted = [s + 's'];
  if (h || m) formatted.unshift(m + 'm');
  if (h) formatted.unshift(h + 'h');
  return formatted.join(' ');
};

const bell = new Audio(bellSound);
const playBell = () => {
  if (!bell.paused) return (bell.currentTime = 0);
  return bell.play();
};

function DisplayText({ reading }: { reading: ReadingActive }) {
  let currentPage;
  if (reading.active) {
    currentPage = `Reading page ${reading.pages.current}`;
  } else if (reading.isFirstTime) {
    currentPage = `Press anywhere to start`;
  } else {
    currentPage = `Paused on page ${reading.pages.current}`;
  }

  const timeLeft = `Time left: ${
    reading.timeLeft ? formatTime(reading.timeLeft) : 'unknown'
  }`;

  const timeDone = `Finish at: ${
    reading.timeDone
      ? new Date(reading.timeDone).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })
      : 'unknown'
  }`;

  return (
    <Typography>
      {currentPage}
      <br />
      {timeLeft}
      <br />
      {timeDone}
    </Typography>
  );
}

export default function ReadingTimer() {
  const reading = useActiveReading(useContext(ActiveReading), {
    timeUpCallback: playBell,
  });

  useEffect(() => {
    const checkInterval = setInterval(() => {
      console.log('time left: ', reading.timeLeftOnPage);
      console.log('time running: ', reading.timeSpentOnPage);
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
        height: '100%',
      }}
    >
      <DisplayText reading={reading} />
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
