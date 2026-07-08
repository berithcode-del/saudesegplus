import { Injectable } from '@nestjs/common';

const ONLINE_THRESHOLD_MS = 30_000; // 30 segundos sem heartbeat = offline

@Injectable()
export class PresenceService {
  /** Map<processId, lastSeenAt> */
  private readonly heartbeats = new Map<string, Date>();

  recordHeartbeat(processId: string): void {
    this.heartbeats.set(processId, new Date());
  }

  isOnline(processId: string): boolean {
    const last = this.heartbeats.get(processId);
    if (!last) return false;
    return Date.now() - last.getTime() < ONLINE_THRESHOLD_MS;
  }

  getOnlineProcessIds(): string[] {
    const now = Date.now();
    const online: string[] = [];
    for (const [id, last] of this.heartbeats.entries()) {
      if (now - last.getTime() < ONLINE_THRESHOLD_MS) {
        online.push(id);
      }
    }
    return online;
  }
}
