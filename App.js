import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
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

  const [isActive, setActive] = useState(false);
  const [pageStart, setPageStart] = useState(new Date());
  const [currentPage, setPage] = useState(initialPage);
  const [pageTimes, setPageTimes] = useState(new PageTimes([], pageBuffer));
  const [overTimeSound, setOverTimeSound] = useState(null);

  const pageTurn = () => {
    if (isActive) {
      pageTimes.add(now - pageStart);
      setPage(currentPage + 1);
    } else {
      setActive(true);
    }
    setPageStart(now);
    setPageTimes(pageTimes);
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
    const timeAllowed = pageTimes.buffer.length && pageTimes.median + extraTime;
    if (timeAllowed && overTimeSound) {
      const timeAlready = now - pageStart;
      const timeLeft = timeAllowed - timeAlready;

      const timer = setTimeout(() => overTimeSound.replayAsync(), timeLeft);

      // cleanup
      return () => {
        clearTimeout(timer);
      };
    }
  }, [overTimeSound, pageTimes, pageStart, extraTime]);

  return (
    <Pressable
      style={styles.touchScreen}
      android_ripple={{
        color: brandColor,
        foreground: true,
      }}
      onPress={pageTurn}
    >
      <Text style={{ color: brandColor }}>{displayText}</Text>
    </Pressable>
  );
}

export default function App() {
  return <PageCounter />;
}
