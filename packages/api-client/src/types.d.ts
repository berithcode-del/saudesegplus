declare module '@capacitor/preferences' {
  export const Preferences: {
    getItem(key: string): Promise<{ value: string | null }>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
}
