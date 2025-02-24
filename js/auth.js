export class Auth {
  constructor() {
    this.dbName = 'userAuthDB';
    this.dbVersion = 1;
    this.storeName = 'users';
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          store.createIndex('email', 'email', { unique: true });
        }
      };
    });
  }

  async registerUser(name, email, password) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Hash password in a real application
      const user = {
        name,
        email,
        password,
        createdAt: new Date()
      };

      const request = store.add(user);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async loginUser(email, password) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const emailIndex = store.index('email');
      
      const request = emailIndex.get(email);

      request.onsuccess = () => {
        const user = request.result;
        if (user && user.password === password) {
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async checkSession() {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(parseInt(userId));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  logout() {
    localStorage.removeItem('userId');
  }
}