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
  isSaved?: boolean;
}

export interface PartialReading extends Partial<Reading> {
  pages?: Partial<Pages>;
}
