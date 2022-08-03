import { Reading } from '../../types/common';

import _ from 'lodash';
import { useState, useEffect, useContext } from 'react';
import db from '../services/Database';
import { usePauseableTimer } from '../hooks/usePauseableTimer';
import Settings from '../context/settings';

/**
 * Hook for the time it took to read pages so far.
 * @param  maxBufferLength - the maximum number of pages to consider when calculating the mean page time.
 * @param initBuffer - the initial record of page times.
 */
export function usePageTimes(
  maxBufferLength: number,
  initBuffer: number[] = []
) {
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
 * Hook for interacting with Reading-type objects.
 */
export function useReading(options: Partial<Reading> = {}) {
  const [data, setData] = useState(
    _.merge(
      {
        pages: { start: 1, current: 1, buffer: [] },
        isSaved: false,
        isCompleted: false,
      },
      options
    )
  );
  const [currentPage, setCurrentPage] = useState(data.pages?.current || 1);
  const [isSaved, setIsSaved] = useState(options.isSaved);
  const [isCompleted, setIsCompleted] = useState(options.isCompleted);

  // could subscribe to save when data state changes

  const saveReading = async (updates: Partial<Reading> & { title: string }) => {
    const now = new Date();
    const defaults = {
      id: updates.title + ' ' + now.getTime().toString(),
      pages: {
        start: 1,
        buffer: [],
      },
      dateCreated: now,
      isCompleted: false,
    };
    const updated: Reading = _.merge(defaults, data, updates, {
      pages: { current: currentPage },
      dateModified: now,
    });
    db.update({ ...updated, isSaved: true }).then(() => {
      setData(old => _.merge(old, updated));
      setIsSaved(true);
    });
  };

  const deleteReading = () =>
    isSaved && data.id && db.delete(data.id).then(() => setIsSaved(false));

  const nextPage = () => {
    const next = currentPage + 1;
    const end = data.pages?.end;
    if (end && next > end) setIsCompleted(true);
    else setCurrentPage(next);
  };

  const previousPage = () => {
    setCurrentPage(currentPage - 1 || 1);
  };

  return {
    ...data,
    nextPage,
    previousPage,
    save: saveReading,
    delete: deleteReading,
  };
}

export function useActiveReading(
  readingData: Reading,
  options: { timeUpCallback: Function }
) {
  const { maxBufferLength, extraReadingTime } = useContext(Settings);
  const { timeUpCallback } = options;

  const reading = useReading(readingData);
  const pageTimes = usePageTimes(maxBufferLength, reading.pages.buffer);
  const timer = usePauseableTimer(0, timeUpCallback); // TODO: save progress on current page to reading

  const [pageStart, setPageStart] = useState(Date.now());
  const [isFirstTime, setIsFirstTime] = useState(
    reading.pages.current === reading.pages.start
  );

  const start = (now = Date.now()) => {
    if (isFirstTime) {
      setPageStart(now);
      setIsFirstTime(false);
    }
    timer.start();
  };

  const turnPage = (now = Date.now()) => {
    const timeSpentReading = timer.timeRunning;
    pageTimes.add(timeSpentReading);
    const nextPageTime = Math.ceil(pageTimes.median + extraReadingTime);
    timer.reset(nextPageTime);
    timer.start();
    reading.save({
      // TODO only save if saved before
      pages: {
        current: reading.pages.current + 1,
        buffer: pageTimes.buffer,
      },
    });
  };

  // const timer = usePauseableTimer();
  //
  // const pageTurn = () => {
  //   const now = Date.now();
  //   if (timer.active) {
  //     const timeSpentReading = now - pageStart - timer.timePaused;
  //     pageTimes.add(timeSpentReading);
  //     const nextPageTime = Math.ceil(pageTimes.median + extraTime);
  //     timer.reset(nextPageTime);
  //     timer.start();
  //     setPageStart(now);
  //     setCurrentPage(currentPage + 1);
  //   } else {
  //     if (currentPage === initialPage) {
  //       setPageStart(now);
  //     }
  //     timer.start();
  //   }
  // };
}
