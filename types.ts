
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum IssueStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  RESOLVED_PENDING_REVIEW = 'RESOLVED_PENDING_REVIEW',
  CONTESTED = 'CONTESTED',
  REOPENED = 'REOPENED',
  PENDING_REVALIDATION = 'PENDING_REVALIDATION',
  RE_RESOLVED = 'RE_RESOLVED',
  FINAL_CLOSED = 'FINAL_CLOSED',
  REJECTED = 'REJECTED'
}

export enum Urgency {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 5
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  credibility: number;
  departmentId?: string;
  rollNumber?: string; // Student roll number
  adminId?: string;    // Admin employee ID
  password?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Proposal {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  votes: number;
}

export interface TimelineEvent {
  id: string;
  type: 'CREATED' | 'STATUS_CHANGE' | 'EVIDENCE_UPLOAD' | 'CONTEST' | 'ADMIN_UPDATE' | 'SUPPORT' | 'APPROVED' | 'REJECTED';
  userId: string;
  userName: string;
  timestamp: string;
  description: string;
  metadata?: {
    oldStatus?: IssueStatus;
    newStatus?: IssueStatus;
    evidenceUrl?: string;
    [key: string]: any;
  };
}

export enum IssueCategory {
  ACADEMICS = 'ACADEMICS',
  HOSTEL = 'HOSTEL',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  HARASSMENT = 'HARASSMENT',
  ADMINISTRATION = 'ADMINISTRATION',
  CAREER_PLACEMENTS = 'CAREER_PLACEMENTS',
  DIGITAL_SERVICES = 'DIGITAL_SERVICES',
  SPORTS_WELLNESS = 'SPORTS_WELLNESS',
  FINANCIAL_SERVICES = 'FINANCIAL_SERVICES',
  TRANSPORTATION = 'TRANSPORTATION',
  OTHER = 'OTHER'
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  creatorId: string;
  departmentId: string;
  status: IssueStatus;
  urgency: Urgency;
  createdAt: string;
  deadline: string;
  priorityScore: number;
  evidenceUrl?: string;
  resolutionEvidenceUrl?: string;
  supportCount: number;
  contestCount: number;
  contestedFlag: boolean;
  contestWindowEnd: string | null;
  revalidationWindowEnd: string | null;
  comments: Comment[];
  proposals: Proposal[];
  timeline: TimelineEvent[];
}

export interface Support {
  userId: string;
  issueId: string;
}

export interface Notification {
  id: string;
  user_id: string;
  issue_id: string;
  type: 'APPROVED' | 'REJECTED' | 'RESOLVED' | 'CONTEST_ACCEPTED' | 'CONTEST_REJECTED' | 'RE_RESOLVED' | 'FINAL_CLOSED' | 'REOPENED';
  message: string;
  read: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  performanceScore: number;
  totalIssues?: number;
  resolvedIssues?: number;
  overdueIssues?: number;
  contestedIssues?: number;
  avgResolutionTime?: number; // in days
}
