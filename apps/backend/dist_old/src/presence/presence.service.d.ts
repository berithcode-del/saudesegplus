export declare class PresenceService {
    private readonly heartbeats;
    recordHeartbeat(processId: string): void;
    isOnline(processId: string): boolean;
    getOnlineProcessIds(): string[];
}
