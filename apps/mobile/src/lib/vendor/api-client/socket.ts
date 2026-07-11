import { useEffect, useRef, useState, useCallback } from 'react';
import type { StorageAdapter } from './storage/types.js';
import { getAuthToken } from './auth.js';
import { getBaseUrl } from './config.js';
import type { QueueEvent, QueueEventType } from '../api-types';

const EVENT_MAP: Record<string, QueueEventType> = {
  queue_update: 'ENQUEUED',
  doctor_status: 'DOCTOR_STATUS',
  teleconsulta_iniciada: 'TELECONSULTA_INICIADA',
  doctor_viewing_patient: 'DOCTOR_VIEWING_PATIENT',
};

const MAX_EVENTS = 50;

export interface UseQueueOptions {
  storage: StorageAdapter;
  baseUrl?: string;
}

export function useQueue({ storage, baseUrl }: UseQueueOptions) {
  const [events, setEvents] = useState<QueueEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<{ on: (event: string, cb: (payload: unknown) => void) => void; emit: (event: string, data: unknown) => void; disconnect: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        if (cancelled) return;

        const url = baseUrl ?? getBaseUrl();
        const token = getAuthToken(storage);

        const socket = io(url, {
          transports: ['websocket', 'polling'],
          auth: { token },
        });

        socket.on('connect', () => {
          if (!cancelled) setConnected(true);
        });

        socket.on('disconnect', () => {
          if (!cancelled) setConnected(false);
        });

        const eventNames = ['queue_update', 'doctor_status', 'teleconsulta_iniciada', 'doctor_viewing_patient'];
        for (const name of eventNames) {
          socket.on(name, (payload: unknown) => {
            if (cancelled) return;
            const type = EVENT_MAP[name] ?? 'ENQUEUED';
            setEvents(prev => [...prev.slice(-(MAX_EVENTS - 1)), { type, payload: (payload ?? {}) as Record<string, unknown> }]);
          });
        }

        socketRef.current = socket;
      } catch {
        console.info('[useQueue] socket.io-client unavailable, using polling fallback');
      }
    };

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [storage, baseUrl]);

  const emitDoctorOnline = useCallback((doctorId: string) => {
    socketRef.current?.emit('doctor_online', { doctorId });
  }, []);

  return { connected, events, emitDoctorOnline };
}
