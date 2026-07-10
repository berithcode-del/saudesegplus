import type { QueueEntryStatus } from '../enums/index.js';

export interface QueueEntry {
  id: string;
  requestId: string;
  enteredQueueAt: string;
  priorityScore: number;
  city?: string;
  state?: string;
  region?: string;
  assignedDoctorId?: string;
  assignedAt?: string;
  status: QueueEntryStatus;
  patientName?: string;
  examPurpose?: string;
  examType?: string;
}

export interface QueueListResponse {
  data: QueueEntry[];
}

export interface EnqueueRequest {
  examRequestId: string;
}

export interface AcceptPatientRequest {
  doctorId: string;
}

export interface QueueUpdatePayload {
  queueEntryId?: string;
  examRequestId?: string;
  patientName?: string;
  position?: number;
  estimatedWait?: number;
}

export interface DoctorStatusPayload {
  doctorId: string;
  status: string;
  online: boolean;
}

export interface TeleconsultaIniciadaPayload {
  examRequestId: string;
  teleconsultationId: string;
  linkSala: string;
  hostRoomUrl?: string;
  startedAt: string;
}

export interface DoctorViewingPatientPayload {
  doctorId: string;
  patientId: string;
  examRequestId: string;
}

export type QueueEventName =
  | 'queue_update'
  | 'doctor_status'
  | 'teleconsulta_iniciada'
  | 'doctor_viewing_patient';

export interface QueueEventMap {
  queue_update: QueueUpdatePayload;
  doctor_status: DoctorStatusPayload;
  teleconsulta_iniciada: TeleconsultaIniciadaPayload;
  doctor_viewing_patient: DoctorViewingPatientPayload;
}

export type QueueEventType =
  | 'ENQUEUED'
  | 'ACCEPTED'
  | 'COMPLETED'
  | 'DOCTOR_STATUS'
  | 'TELECONSULTA_INICIADA'
  | 'DOCTOR_VIEWING_PATIENT';

export interface QueueEvent {
  type: QueueEventType;
  payload: Record<string, unknown>;
}
