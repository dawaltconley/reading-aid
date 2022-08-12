import { Reading } from '../../types/common';
import { openDB, IDBPDatabase } from 'idb';

class Database {
  private db: Promise<IDBPDatabase>;
  readonly store: string;

  constructor(name: string, version: number, store: string) {
    this.store = store;
    this.db = openDB(name, version, {
      upgrade(db, oldVersion) {
        const generic = { unique: false };
        switch (oldVersion) {
          case 0: {
            const objectStore = db.createObjectStore(store, {
              keyPath: 'id',
            });
            objectStore.createIndex('id', 'id', { unique: true });
            objectStore.createIndex('title', 'title', generic);
            objectStore.createIndex('startPage', 'pages.start', generic);
            objectStore.createIndex('endPage', 'pages.end', generic);
            objectStore.createIndex('currentPage', 'pages.current', generic);
            objectStore.createIndex('pageBuffer', 'pages.buffer', generic);
            objectStore.createIndex('dateCreated', 'dateCreated', generic);
            objectStore.createIndex('dateModified', 'dateModified', generic);
            objectStore.createIndex('isCompleted', 'isCompleted', generic);
          }
        }
      },
    });
  }

  async update(reading: Reading) {
    const db = await this.db;
    return db.put(this.store, reading).then(e => console.log('object key', e));
  }

  async delete(id: string) {
    const db = await this.db;
    return db.delete(this.store, id);
  }

  async get(query: IDBKeyRange | string): Promise<Reading> {
    const db = await this.db;
    return db.get(this.store, query);
  }

  async getAll(query?: IDBKeyRange | string | null): Promise<Reading[]> {
    const db = await this.db;
    return db.getAll(this.store, query);
  }
}

export default new Database('reading_aid', 1, 'readings');
