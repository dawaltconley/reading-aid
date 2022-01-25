import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

// const brandColor = 'hsl(180, 90%, 67%)';
const brandColor = 'hsl(268, 100%, 46%)';

const timeUpSoundFile = require('./assets/bell.mp3');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchScreen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

function usePageTimes(maxBufferLength, initBuffer = []) {
  const [buffer, setBuffer] = useState(initBuffer);
  const [maxPages, setMaxPages] = useState(maxBufferLength);

  const add = newTime => {
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

function usePauseableTimer(initialTime = 0, cb = null) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [callback, setCallback] = useState(() => cb);
  const [timePaused, setTimePaused] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [pausedAt, setPausedAt] = useState(null);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    if (callback && timeLeft > 0) {
      const timeLeft = getTimeLeft();
      const timer = setTimeout(callback, timeLeft);
      return () => clearTimeout(timer);
    }
  }, [callback, timeLeft, paused, startedAt]);

  const getTimeLeft = () => {
    if (paused) return timeLeft;
    const timeRunning = new Date() - startedAt;
    return timeLeft - timeRunning;
  };

  const start = () => {
    const now = new Date();
    const timeJustPaused = pausedAt ? now - pausedAt : 0;
    setTimePaused(t => t + timeJustPaused);
    setPaused(false);
    setStartedAt(now);
  };

  const pause = () => {
    const now = new Date();
    setTimeLeft(getTimeLeft());
    setPaused(true);
    setPausedAt(now);
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

function PageCounter(props) {
  const { initialPage = 1, pageBuffer = 7, extraTime = 30000 } = props;
  console.log('updated!');

  const timer = usePauseableTimer();
  const [pageStart, setPageStart] = useState(null);

  const pageTimes = usePageTimes(pageBuffer);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [overTimeSound, setOverTimeSound] = useState(null);

  const pageTurn = () => {
    const now = new Date();
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

  // loads a sound file when component mounts and holds in memory until unmount
  // TODO: check if this is better or worse than loading each time / as needed
  useEffect(() => {
    // load sound and set to timer callback
    console.log('loading sound');
    Audio.Sound.createAsync(timeUpSoundFile).then(({ sound }) => {
      setOverTimeSound(sound);
      timer.callback = () => sound.replayAsync();
    });
    // cleanup
    return () => {
      if (overTimeSound) overTimeSound.unloadAsync();
      if (timer.callback) timer.callback = null;
    };
  }, []);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      console.log('time left: ', timer.timeLeft);
    }, 1000);
    return () => clearInterval(checkInterval);
  }, [timer]);

  return (
    <Pressable
      style={styles.touchScreen}
      android_ripple={{
        color: brandColor,
        foreground: true,
      }}
      onPress={pageTurn}
      onLongPress={timer.pause}
    >
      <Text style={{ color: brandColor }}>{displayText}</Text>
    </Pressable>
  );
}

export default function App() {
  return <PageCounter />;
}
