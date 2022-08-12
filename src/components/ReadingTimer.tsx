import { useEffect } from 'react';
import { Container, Stack, Typography, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faForwardStep,
  faBackwardStep,
} from '@fortawesome/pro-solid-svg-icons';

import AppMenu from './AppMenu';
import { useActiveReading } from '../hooks/useReading';
import bellSound from '../assets/bell.mp3';

const bell = new Audio(bellSound);
const playBell = () => {
  if (!bell.paused) return (bell.currentTime = 0);
  return bell.play();
};

export default function ReadingTimer() {
  const reading = useActiveReading(
    {},
    {
      timeUpCallback: playBell,
    }
  );

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
