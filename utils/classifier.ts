import { IssueCategory } from '../types';
import { CATEGORY_CONFIG } from '../constants';

const KEYWORDS: Record<string, string[]> = {
    [IssueCategory.ACADEMICS]: ['exam', 'result', 'grade', 'attendance', 'faculty', 'course', 'syllabus', 'credits', 'degree', 'mark', 'semester', 'professor', 'lecture', 'assignment', 'hall ticket'],
    [IssueCategory.HOSTEL]: ['room', 'mess', 'food', 'water', 'laundry', 'hostel', 'warden', 'roommate', 'cleaning', 'dorm', 'electricity', 'bathroom', 'canteen'],
    [IssueCategory.INFRASTRUCTURE]: ['fan', 'light', 'ac', 'vent', 'lift', 'building', 'toilet', 'pipe', 'furniture', 'desk', 'chair', 'window', 'door', 'repair', 'laboratory', 'wifi', 'internet', 'connectivity'],
    [IssueCategory.HARASSMENT]: ['bullying', 'harass', 'ragging', 'safety', 'threat', 'abuse', 'misconduct', 'security', 'fight', 'discrimination'],
    [IssueCategory.ADMINISTRATION]: ['id card', 'fee', 'admission', 'scholarship', 'certificate', 'document', 'bank', 'official', 'office', 'refund', 'payment', 'registra', 'transcript'],
    [IssueCategory.CAREER_PLACEMENTS]: ['interview', 'offer letter', 'ctc', 'internship', 'recruitment', 'placement', 'company', 'job', 'resume', 'cv', 'career'],
    [IssueCategory.DIGITAL_SERVICES]: ['wifi', 'login', 'portal', 'internet', 'ethernet', 'website', 'app', 'software', 'license', 'password reset', 'moodle', 'erp'],
    [IssueCategory.SPORTS_WELLNESS]: ['gym', 'ground', 'tournament', 'sports', 'coach', 'equipment', 'football', 'cricket', 'badminton', 'stadium'],
    [IssueCategory.FINANCIAL_SERVICES]: ['refund', 'receipt', 'fee', 'challan', 'excess payment', 'tuition', 'scholarship', 'transaction', 'billing'],
    [IssueCategory.TRANSPORTATION]: ['bus', 'shuttle', 'parking', 'transport', 'vehicle', 'commute', 'route', 'driver'],
    [IssueCategory.OTHER]: []
};

// Map extra keywords for health (not a category, but we have a health dept)
const HEALTH_KEYWORDS = ['sick', 'medicine', 'clinic', 'doctor', 'nurse', 'ambulance', 'pharmacy', 'mental health', 'therapy', 'fever', 'appointment'];

export interface ClassificationResult {
    category: IssueCategory;
    departmentId: string;
}

export const classifyIssue = (description: string): ClassificationResult => {
    const text = description.toLowerCase();
    let bestCategory = IssueCategory.OTHER;
    let maxMatches = 0;

    // 1. Determine Category
    for (const [category, keywords] of Object.entries(KEYWORDS)) {
        const matches = keywords.filter(word => text.includes(word)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            bestCategory = category as IssueCategory;
        }
    }

    // 2. Determine Department based on category default
    let departmentId = CATEGORY_CONFIG[bestCategory].defaultDeptId;

    // 3. Override department if health keywords are predominant
    const healthMatches = HEALTH_KEYWORDS.filter(word => text.includes(word)).length;
    if (healthMatches > maxMatches) {
        departmentId = 'dept-4'; // Health Services
        // If it's health related but categorized as OTHER, maybe just keep OTHER or move back to default cat
    }

    return {
        category: bestCategory,
        departmentId
    };
};
