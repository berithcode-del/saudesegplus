declare module '@capacitor/preferences' {
  export const Preferences: {
    getItem(key: string): Promise<{ value: string | null }>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
}

declare module 'socket.io-client' {
  export function io(...args: unknown[]): {
    on(event: string, cb: (payload: unknown) => void): void;
    emit(event: string, data: unknown): void;
    disconnect(): void;
  };
}
