import { Reading, PartialReading } from '../../types/common';

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
export function useReading(options: PartialReading = {}) {
  const { dateModified, ...reading } = options;
  const [data, setData] = useState(
    _.merge(
      {
        pages: { start: 1, current: 1, buffer: [] },
        isSaved: false,
        isCompleted: false,
      },
      reading
    )
  );
  const [currentPage, setCurrentPage] = useState(data.pages?.current || 1);
  const [isSaved, setIsSaved] = useState(options.isSaved);
  const [isCompleted, setIsCompleted] = useState(options.isCompleted);
  const [modified, setModified] = useState(dateModified);

  // could subscribe to save when data state changes

  const update = async (updates: PartialReading) =>
    setData(old => _.merge(old, updates));

  useEffect(() => {
    // save reading on data change, if it has a title
    const title = data.title;
    if (!title) return;
    const now = new Date();
    const updated = {
      id: title + ' ' + now.getTime().toString(),
      dateCreated: now,
      title,
      ...data,
    };
    if (!_.isEqual(data, updated)) setData(updated);
    db.update({
      ...updated,
      dateModified: now,
    }).then(() => {
      setIsSaved(true);
      setModified(now);
    });
  }, [data]);

  const deleteReading = () =>
    isSaved && data.id && db.delete(data.id).then(() => setIsSaved(false));

  // TODO rewrite
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
    update,
    delete: deleteReading,
  };
}

export function useActiveReading(
  readingData: PartialReading,
  options: { timeUpCallback: Function }
) {
  const { maxBufferLength, extraReadingTime } = useContext(Settings);
  const { timeUpCallback } = options;

  const reading = useReading(readingData);
  const pageTimes = usePageTimes(maxBufferLength, reading.pages.buffer);
  const timer = usePauseableTimer(0, timeUpCallback); // TODO: save progress on current page to reading

  // const [pageStart, setPageStart] = useState(Date.now());
  const [isFirstTime, setIsFirstTime] = useState(
    reading.pages.current === reading.pages.start
  );

  const start = (/* now = Date.now() */) => {
    if (isFirstTime) {
      // setPageStart(now);
      setIsFirstTime(false);
    }
    timer.start();
  };

  const nextPage = () => {
    const timeSpentReading = timer.timeRunning;
    pageTimes.add(timeSpentReading);
    const nextPageTime = Math.ceil(pageTimes.median + extraReadingTime);
    timer.reset(nextPageTime);
    timer.start();
    reading.update({
      pages: {
        current: reading.pages.current + 1,
        buffer: pageTimes.buffer,
      },
    });
  };

  return {
    ...reading,
    ..._.pick(timer, ['pause', 'paused', 'active']),
    get timeLeft() {
      return timer.timeLeft;
    },
    get timeRunning() {
      return timer.timeRunning;
    },
    start,
    nextPage,
  };
}
