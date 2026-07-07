export const ADMIN_CREDENTIALS = {
  email: 'admin@yellowowl.com',
  password: 'Admin@2026',
};

export const ADMIN_SESSION_KEY = 'yellowowl_admin_session';

export interface School {
  id: string;
  name: string;
  branch: string;
  board: 'CBSE' | 'Stateboard' | 'ICSE' | 'IB';
  address: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactEmail?: string;
  contactPhone?: string;
  countryCode?: string;
  numberOfGrades?: number;
  gradeNames?: string[];
}

export interface AdminUser {
  id: string;
  childName: string;
  age: number;
  guardianContact: string;
  guardianEmail?: string;
  weeklySession: number;
  usageMode: 'general' | 'school';
  grade?: string;
  schoolId?: string;
  rollNo?: string;
  countryCode?: string;
}

export const MOCK_SCHOOLS: School[] = [
  {
    id: 's1',
    name: 'Sunrise Academy',
    branch: 'Anna Nagar',
    board: 'CBSE',
    address: '12 Main Road, Anna Nagar, Chennai, Tamil Nadu – 600040',
    addressLine1: '12 Main Road',
    addressLine2: 'Anna Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600040',
    numberOfGrades: 5,
    gradeNames: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'],
    contactPhone: '9876543210',
    countryCode: '+91',
  },
  {
    id: 's2',
    name: 'Heritage High School',
    branch: 'T Nagar',
    board: 'Stateboard',
    address: '45 Park Street, T Nagar, Chennai, Tamil Nadu – 600017',
    addressLine1: '45 Park Street',
    addressLine2: 'T Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600017',
    numberOfGrades: 5,
    gradeNames: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'],
    contactPhone: '9123456789',
    countryCode: '+91',
  },
  {
    id: 's3',
    name: 'Green Valley School',
    branch: 'Velachery',
    board: 'CBSE',
    address: '8 Lake View Road, Velachery, Chennai, Tamil Nadu – 600042',
    addressLine1: '8 Lake View Road',
    addressLine2: 'Velachery',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600042',
    numberOfGrades: 5,
    gradeNames: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'],
    contactPhone: '9988776655',
    countryCode: '+91',
  },
];

export const MOCK_ADMIN_USERS: AdminUser[] = [
  {
    id: 'u1',
    childName: 'Arjun Kumar',
    age: 10,
    guardianContact: '9876543210',
    guardianEmail: 'kumar@gmail.com',
    weeklySession: 20,
    usageMode: 'school',
    grade: 'Grade 3',
    schoolId: 's1',
    rollNo: 'ARJ101',
    countryCode: '+91',
  },
  {
    id: 'u2',
    childName: 'Priya Sharma',
    age: 12,
    guardianContact: '9123456789',
    guardianEmail: 'sharma@gmail.com',
    weeklySession: 30,
    usageMode: 'general',
    rollNo: 'PRI202',
    countryCode: '+91',
  },
  {
    id: 'u3',
    childName: 'Aditya Nair',
    age: 11,
    guardianContact: '9988776655',
    guardianEmail: 'nair@gmail.com',
    weeklySession: 15,
    usageMode: 'school',
    grade: 'Grade 4',
    schoolId: 's2',
    rollNo: 'ADI303',
    countryCode: '+91',
  },
];
