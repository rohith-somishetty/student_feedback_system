import { Urgency, UserRole, IssueStatus, IssueCategory } from './types';

export const DEPARTMENTS = [
  { id: 'dept-1', name: 'Academic Affairs', performanceScore: 88 },
  { id: 'dept-2', name: 'Student Welfare', performanceScore: 92 },
  { id: 'dept-3', name: 'Infrastructure & Facilities', performanceScore: 75 },
  { id: 'dept-4', name: 'Health Services', performanceScore: 81 },
  { id: 'dept-5', name: 'Disciplinary Committee', performanceScore: 95 },
  { id: 'dept-6', name: 'General Administration', performanceScore: 85 },
  { id: 'dept-7', name: 'Placement & Corporate Relations', performanceScore: 90 },
  { id: 'dept-8', name: 'IT & Network Operations', performanceScore: 82 },
  { id: 'dept-9', name: 'Physical Education & Sports', performanceScore: 87 },
  { id: 'dept-10', name: 'Finance & Accounts', performanceScore: 84 },
  { id: 'dept-11', name: 'Library Management', performanceScore: 89 },
];

export const CREDIBILITY_THRESHOLDS = {
  MIN_TO_CONTEST: 65,
  MIN_CONTESTS_REQUIRED: 5,
};

export const CREDIBILITY_RULES = {
  SUBMIT_VALID_ISSUE: 5,
  SUPPORT_RESOLVED_ISSUE: 2,
  FAKE_REPORT_PENALTY: -15,
  MALICIOUS_CONTEST_PENALTY: -15,
};

export const CATEGORY_CONFIG: Record<IssueCategory, { defaultDeptId: string, baseDeadlineDays: number }> = {
  [IssueCategory.ACADEMICS]: { defaultDeptId: 'dept-1', baseDeadlineDays: 7 },
  [IssueCategory.HOSTEL]: { defaultDeptId: 'dept-2', baseDeadlineDays: 3 },
  [IssueCategory.INFRASTRUCTURE]: { defaultDeptId: 'dept-3', baseDeadlineDays: 5 },
  [IssueCategory.HARASSMENT]: { defaultDeptId: 'dept-5', baseDeadlineDays: 1 }, // Critical
  [IssueCategory.ADMINISTRATION]: { defaultDeptId: 'dept-6', baseDeadlineDays: 10 },
  [IssueCategory.CAREER_PLACEMENTS]: { defaultDeptId: 'dept-7', baseDeadlineDays: 5 },
  [IssueCategory.DIGITAL_SERVICES]: { defaultDeptId: 'dept-8', baseDeadlineDays: 2 },
  [IssueCategory.SPORTS_WELLNESS]: { defaultDeptId: 'dept-9', baseDeadlineDays: 4 },
  [IssueCategory.FINANCIAL_SERVICES]: { defaultDeptId: 'dept-10', baseDeadlineDays: 7 },
  [IssueCategory.TRANSPORTATION]: { defaultDeptId: 'dept-3', baseDeadlineDays: 3 },
  [IssueCategory.OTHER]: { defaultDeptId: 'dept-2', baseDeadlineDays: 7 },
};

export const MOCK_USERS = [
  {
    id: 'u1',
    name: 'Alex Johnson',
    email: 'alex@student.edu',
    role: UserRole.STUDENT,
    credibility: 72,
    rollNumber: '123456789012',
    password: '0000'
  },
  {
    id: 'u2',
    name: 'Sarah Chen',
    email: 'sarah@admin.edu',
    role: UserRole.ADMIN,
    credibility: 100,
    departmentId: 'dept-1',
    adminId: 'ADM001',
    password: '0000'
  },
  {
    id: 'super-admin-1',
    name: 'Leadership Council',
    email: 'leadership@institution.edu',
    role: UserRole.ADMIN,
    credibility: 100,
    adminId: 'SA001',
    password: '0000'
  },
  {
    id: 'u3',
    name: 'Sam Rivera',
    email: 'sam@student.edu',
    role: UserRole.STUDENT,
    credibility: 45,
    rollNumber: '987654321098',
    password: '0000'
  },
];

export const MOCK_ISSUES = [
  {
    id: 'iss-1',
    title: 'Broken Ventilation in Lab 402',
    description: 'The ventilation system in the chemical lab has been non-functional for 3 days, posing a safety risk.',
    category: IssueCategory.INFRASTRUCTURE,
    creatorId: 'u1',
    departmentId: 'dept-3',
    status: IssueStatus.OPEN,
    urgency: Urgency.CRITICAL,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    priorityScore: 150.5,
    supportCount: 12,
    contestCount: 0,
    comments: [],
    proposals: [],
    timeline: [
      {
        id: 'timeline-1',
        type: 'CREATED',
        userId: 'u1',
        userName: 'Alex Johnson',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: 'Issue created',
      }
    ],
  },
  {
    id: 'iss-2',
    title: 'Delay in Exam Results Publication',
    description: 'Final semester results for Dept-1 were promised last week but are still pending.',
    category: IssueCategory.ACADEMICS,
    creatorId: 'u3',
    departmentId: 'dept-1',
    status: IssueStatus.IN_REVIEW,
    urgency: Urgency.MEDIUM,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    deadline: new Date(Date.now() + 86400000).toISOString(),
    priorityScore: 42.8,
    supportCount: 5,
    contestCount: 0,
    comments: [],
    proposals: [],
    timeline: [
      {
        id: 'timeline-2',
        type: 'CREATED',
        userId: 'u3',
        userName: 'Sam Rivera',
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        description: 'Issue created',
      }
    ],
  }
];
