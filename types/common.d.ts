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
