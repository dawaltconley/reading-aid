import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';

export interface MenuItem {
  name: string;
  icon: IconDefinition;
  action: Function;
}

interface Pages {
  start: number;
  end?: number;
  current: number;
  buffer: number[];
}

export interface Reading {
  id: string;
  title: string;
  pages: Pages;
  dateCreated: Date;
  dateModified: Date;
  isCompleted: boolean;
  isSaved: boolean;
}

export interface ReadingPartial extends Partial<Reading> {
  pages?: Partial<Pages>;
}

export interface ReadingMinimal
  extends Pick<Reading, 'pages' | 'isCompleted' | 'isSaved'>,
    ReadingPartial {}

export interface ReadingHook extends ReadingMinimal {
  update: (ReadingPartial) => Promise<void>;
  delete: () => void;
}

export interface ReadingActive extends ReadingMinimal {
  start: () => void;
  pause: () => void;
  nextPage: () => void;
  paused: boolean;
  active: boolean;
  isFirstTime: boolean;
  timeLeftOnPage: number;
  timeSpentOnPage: number;
  timeLeft: number | null;
  timeDone: number | null;
}
