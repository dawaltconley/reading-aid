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

class PageTimes {
  constructor(array, maxBufferLength) {
    this.buffer = array.slice(0, maxBufferLength);
    this.maxBufferLength = maxBufferLength;
  }

  get sorted() {
    return [...this.buffer].sort((a, b) => a - b);
  }

  get median() {
    const sorted = this.sorted;
    const middle = (sorted.length - 1) / 2;
    if (Number.isInteger(middle)) {
      return sorted[middle];
    } else {
      const low = Math.floor(middle),
        high = Math.ceil(middle);
      return (sorted[low] + sorted[high]) / 2;
    }
  }

  add(newTime) {
    this.buffer.push(newTime);
    if (this.buffer.length > this.maxBufferLength) {
      this.buffer.shift();
    }
  }
}

class PauseableTimer {
  #timeLeft;
  #paused;
  #startedAt;

  constructor(initialTime, callback) {
    this.totalTime = initialTime;
    this.#timeLeft = initialTime;
    this.callback = callback;
    this.#paused = true;

    this.start = this.start.bind(this);
    this.pause = this.pause.bind(this);
  }

  get paused() {
    return this.#paused;
  }

  get timeLeft() {
    if (this.#paused || !this.#startedAt) {
      return this.#timeLeft;
    }
    const timeRunning = new Date() - this.#startedAt;
    return this.#timeLeft - timeRunning;
  }

  start() {
    this.#paused = false;
    this.#startedAt = new Date();
    this.timeout = setTimeout(this.#done.bind(this), this.timeLeft);
  }

  pause() {
    this.#timeLeft = this.timeLeft;
    this.#paused = true;
    clearTimeout(this.timeout);
  }

  #done() {
    this.#paused = true;
    this.#timeLeft = 0;
    if (this.callback) this.callback();
  }
}

function PageCounter(props) {
  const { initialPage = 1, pageBuffer = 7, extraTime = 30000 } = props;
  const now = new Date();
  console.log('updated!');

  const [isActive, setActive] = useState(false);
  const [pageStart, setPageStart] = useState(new Date());
  const [currentPage, setPage] = useState(initialPage);
  const [overTimeSound, setOverTimeSound] = useState(null);

  const pageTimes = useRef(new PageTimes([], pageBuffer));
  const pageTimer = useRef(new PauseableTimer(0));

  const pageTurn = () => {
    if (isActive) {
      pageTimes.current.add(now - pageStart);
      setPage(currentPage + 1);
    } else {
      unpause();
    }
    setPageStart(now);
  };

  const pause = () => {
    setActive(false);
    console.log('paused');
  };

  const unpause = () => {
    setActive(true);
    console.log('unpaused');
  };

  const displayText = isActive
    ? `Current page: ${currentPage}`
    : 'Press anywhere to start';

  // loads a sound file when component mounts and holds in memory until unmount
  // TODO: check if this is better or worse than loading each time / as needed
  useEffect(() => {
    // load sound
    Audio.Sound.createAsync(timeUpSoundFile).then(({ sound }) =>
      setOverTimeSound(sound)
    );
    // cleanup
    if (overTimeSound) {
      return overTimeSound.unloadAsync.bind(overTimeSound);
    }
  }, []);

  // play sound after timer
  useEffect(() => {
    if (
      pageTimer.current.page !== currentPage &&
      pageTimes.current.buffer &&
      overTimeSound
    ) {
      const timeAllowed = pageTimes.current.median + extraTime;
      pageTimer.current = new PauseableTimer(timeAllowed, () => {
        overTimeSound.replayAsync();
      });
      pageTimer.current.page = currentPage;
    }
    if (isActive && pageTimer.current.paused) {
      pageTimer.current.start();
    }
    return () => pageTimer.current.pause();
  }, [isActive, overTimeSound, currentPage]);

  useEffect(() => {
    const checkInterval = setInterval(
      () => console.log(`time left: ${pageTimer.current.timeLeft}`),
      1000
    );
    return () => clearInterval(checkInterval);
  }, []);

  return (
    <Pressable
      style={styles.touchScreen}
      android_ripple={{
        color: brandColor,
        foreground: true,
      }}
      onPress={pageTurn}
      onLongPress={pause}
    >
      <Text style={{ color: brandColor }}>{displayText}</Text>
    </Pressable>
  );
}

export default function App() {
  return <PageCounter />;
}
