export interface CreateVideoRoomRequest {
  examRequestId: string;
  doctorId?: string;
}

export interface Teleconsultation {
  id: string;
  requestId: string;
  doctorId: string;
  startedAt: string;
  endedAt?: string;
  videoSessionId?: string;
  recordingUrl?: string;
  clinicalNotes?: string;
  hostRoomUrl?: string;
}

export interface CreateVideoRoomResponse {
  success: boolean;
  data: Teleconsultation;
}

export interface TeleconsultationDetail {
  id: string;
  videoSessionId: string;
  hostRoomUrl: string;
  startedAt: string;
  patientName: string;
  examPurpose: string;
  doctorName: string;
}

export type { CreateVideoRoomRequest as CreateRoomDto };
