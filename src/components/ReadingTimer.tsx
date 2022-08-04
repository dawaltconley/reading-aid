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

const bell = new Audio(bellSound);
const playBell = () => {
  if (!bell.paused) return (bell.currentTime = 0);
  return bell.play();
};

export default function ReadingTimer() {
  const reading = useActiveReading(useContext(ActiveReading), {
    timeUpCallback: playBell,
  });

  let displayText;
  if (reading.active) {
    displayText = (
      <Typography>
        Reading page {reading.pages.current}
        <br />
        Time left: {reading.timeLeft || 'unknown'}
      </Typography>
    );
  } else if (reading.isFirstTime) {
    displayText = <Typography>Press anywhere to start</Typography>;
  } else {
    displayText = (
      <Typography>
        Paused on page {reading.pages.current} <br />
        Time left: {reading.timeLeft || 'unknown'}
      </Typography>
    );
  }

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
      {displayText}
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
