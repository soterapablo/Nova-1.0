
export type UserRole = 'SOCIO' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  dni: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  photoUrl?: string;
  phone?: string;
  emergencyPhone?: string;
  birthDate?: string;
  medicalNotes?: string;
  mustChangePassword?: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  timestamp: number;
  type: 'CHECK_IN' | 'CHECK_OUT';
  location: {
    lat: number;
    lng: number;
  };
}

export enum FacilityType {
  TELESCOPE_MAIN = 'Telescopio Principal',
  TELESCOPE_PORTABLE = 'Telescopios Portátiles',
  DOME_GEODESIC = 'Domo Geodésico',
  MUSEUM = 'Museo'
}

export interface FacilityRequest {
  id: string;
  userId: string;
  attendeeIds?: string[];
  facility: FacilityType;
  date: string;
  timeStart: string;
  durationHours: number;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Project {
  id: string;
  creatorId: string;
  collaboratorIds: string[];
  title: string;
  description: string;
  objectives: string;
  status: 'IDEA' | 'IN_PROGRESS' | 'COMPLETED';
  timestamp: number;
  aiEvaluation?: {
    feasibilityScore: number;
    category: string;
    strategicSuggestion: string;
  };
}

export interface IncidentReport {
  id: string;
  userId: string;
  title?: string;
  description: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
  aiAnalysis?: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    summary: string;
    category: string;
  };
}
