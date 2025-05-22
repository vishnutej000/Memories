// Replace Dexie with a custom IndexedDB wrapper
const IndexedDBWrapper = {
  open(dbName, version, schemaCallback) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (schemaCallback) schemaCallback(db);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        resolve(this._wrapDatabase(db, dbName));
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },
  
  _wrapDatabase(db, dbName) {
    const wrapper = {
      name: dbName,
      tables: {},
      version: db.version,
      
      table(tableName) {
        if (!this.tables[tableName]) {
          this.tables[tableName] = {
            add: (item) => this._transaction(tableName, 'readwrite', (store) => store.add(item)),
            put: (item) => this._transaction(tableName, 'readwrite', (store) => store.put(item)),
            get: (key) => this._transaction(tableName, 'readonly', (store) => store.get(key)),
            delete: (key) => this._transaction(tableName, 'readwrite', (store) => store.delete(key)),
            clear: () => this._transaction(tableName, 'readwrite', (store) => store.clear()),
            toArray: () => this._transaction(tableName, 'readonly', (store) => {
              return new Promise((resolve) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
              });
            }),
            where: (indexName) => {
              return {
                equals: (value) => this._transaction(tableName, 'readonly', (store) => {
                  return new Promise((resolve) => {
                    const index = store.index(indexName);
                    const request = index.getAll(value);
                    request.onsuccess = () => resolve(request.result);
                  });
                }),
                // Add more query methods as needed
              };
            }
          };
        }
        return this.tables[tableName];
      },
      
      _transaction(tableName, mode, callback) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(tableName, mode);
          const store = transaction.objectStore(tableName);
          
          let result;
          try {
            result = callback(store);
            if (!(result instanceof Promise)) {
              const request = result;
              result = new Promise((res) => {
                request.onsuccess = () => res(request.result);
              });
            }
          } catch (error) {
            reject(error);
            return;
          }
          
          transaction.oncomplete = () => resolve(result);
          transaction.onerror = (event) => reject(event.target.error);
        });
      }
    };
    
    return wrapper;
  }
};

// Export as Dexie to maintain compatibility with existing code
export const Dexie = IndexedDBWrapper;