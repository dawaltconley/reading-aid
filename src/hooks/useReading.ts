import { Reading, PartialReading } from '../../types/common';

import _ from 'lodash';
import { useState, useEffect, useContext, useRef } from 'react';
import db from '../services/Database';
import { usePauseableTimer } from '../hooks/usePauseableTimer';
import Settings from '../context/Settings';

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
  const [isSaved, setIsSaved] = useState(options.isSaved);

  console.log('current page', data.pages.current);
  const update = async (updates: PartialReading) => {
    console.log('updating', { updates }, { data });
    let updated = _.merge({ ...data }, updates);
    if (_.isEqual(data, updated)) return;

    const title = updated.title;
    console.log('setting state');
    if (!title) return setData(updated);

    // if reading has a title, save on update
    const now = new Date();
    const updated2 = {
      id: updated.title + ' ' + now.getTime().toString(),
      dateCreated: now,
      title,
      ...updated,
      dateModified: now,
      isSaved: true,
    };
    db.update(updated2).then(() => {
      console.log('saved');
      setIsSaved(true);
      setData(updated);
    });
  };

  const deleteReading = () =>
    isSaved && data.id && db.delete(data.id).then(() => setIsSaved(false));

  return {
    ...data,
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

  const [isFirstTime, setIsFirstTime] = useState(
    reading.pages.current === reading.pages.start
  );

  const start = () => {
    if (isFirstTime) {
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

    const { current, end } = reading.pages;
    if (end && current === end)
      reading.update({
        isCompleted: true,
        pages: {
          buffer: pageTimes.buffer,
        },
      });
    else
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
