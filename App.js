import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

// const brandColor = 'hsl(180, 90%, 67%)';
const brandColor = 'hsl(268, 100%, 46%)';

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

const samplePageTimes = [124, 123, 754, 4, 200, 180, 152];

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
      console.log({ middle, low, high, sorted });
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

function PageCounter(props) {
  const {
    initialPage = 1,
    pageBuffer = 7,
    // extraTime = 30000,
    extraTime = 3000,
  } = props;
  const [pageStart, setPageStart] = useState(new Date());
  const [currentPage, setPage] = useState(initialPage);
  const [pageTimes, setPageTimes] = useState(new PageTimes([], pageBuffer));
  const timeAllowed = pageTimes.buffer.length && pageTimes.median + extraTime;
  let timer;

  const pageTurn = () => {
    const pageEnd = new Date();
    pageTimes.add(pageEnd - pageStart);
    if (timer) clearTimeout();

    setPage(currentPage + 1);
    setPageStart(pageEnd);
    setPageTimes(pageTimes);
  };

  const outOfTime = () => {
    // play sound
  };

  if (timeAllowed) {
    timer = setTimeout(outOfTime, timeAllowed);
  }

  return (
    <Pressable
      style={styles.touchScreen}
      android_ripple={{
        color: brandColor,
        foreground: true,
      }}
      onPress={pageTurn}
    >
      <Text style={{ color: brandColor }}>Current page: {currentPage}</Text>
    </Pressable>
  );
}

export default function App() {
  return <PageCounter />;
}
