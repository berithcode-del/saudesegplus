declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Link: any;
  export const NavLink: any;
  export const Navigate: any;
  export const Outlet: any;
  export const Route: any;
  export const Routes: any;
  export function useLocation(): { pathname: string };
  export function useNavigate(): (path: string) => void;
  export function useParams<T extends Record<string, string | undefined>>(): T;
}

declare module 'socket.io-client' {
  export function io(...args: unknown[]): {
    on(event: string, cb: (payload: unknown) => void): void;
    emit(event: string, data: unknown): void;
    disconnect(): void;
  };
}

declare module '@capacitor/preferences' {
  export const Preferences: {
    getItem(key: string): Promise<{ value: string | null }>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
}
