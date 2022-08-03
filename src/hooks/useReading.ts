import { Reading } from '../../types/common';

import _ from 'lodash';
import { useState } from 'react';
import db from '../services/Database';

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
 * Hook for the
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
