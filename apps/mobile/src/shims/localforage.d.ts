declare module 'localforage' {
  interface LocalForageOptions {
    name?: string;
    storeName?: string;
    driver?: string | string[];
    size?: number;
    version?: number | string;
    description?: string;
  }

  interface LocalForageDbInstance {
    getItem<T>(key: string): Promise<T | null>;
    setItem<T>(key: string, value: T): Promise<T>;
    removeItem(key: string): Promise<void>;
    length(): Promise<number>;
    keys(): Promise<string[]>;
    iterate<T, U>(iterator: (value: T, key: string, iterationNumber: number) => U): Promise<U>;
    createInstance(options?: LocalForageOptions): LocalForageDbInstance;
    driver(): string;
    setDriver(driver: string | string[]): void;
    ready(): Promise<void>;
    config(options: LocalForageOptions): void;
    defineDriver(driver: any): Promise<void>;
    support(): boolean;
  }

  const localforage: LocalForageDbInstance;
  export default localforage;
}
