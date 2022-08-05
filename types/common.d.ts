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

export interface PartialReading extends Partial<Reading> {
  pages?: Partial<Pages>;
}

export interface MinimalReading
  extends Pick<Reading, 'pages' | 'isCompleted' | 'isSaved'>,
    PartialReading {}

export interface ReadingHook extends MinimalReading {
  update: (PartialReading) => Promise<void>;
  delete: () => void;
}

export interface ActiveReading extends MinimalReading {
  start: () => void;
  pause: () => void;
  nextPage: () => void;
  paused: boolean;
  active: boolean;
  isFirstTime: boolean;
  timeLeftOnPage: number;
  timeSpentOnPage: number;
  timeLeft: number | null;
  endTime: number | null;
}
