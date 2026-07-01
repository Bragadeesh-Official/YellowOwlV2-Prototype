export const ADMIN_CREDENTIALS = {
  email: 'admin@yellowowl.com',
  password: 'Admin@2026',
};

export const ADMIN_SESSION_KEY = 'yellowowl_admin_session';

export interface School {
  id: string;
  name: string;
  branch: string;
  board: 'CBSE' | 'Stateboard';
  address: string;
  contactEmail?: string;
  contactPhone?: string;
  numberOfGrades?: number;
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
}

export const MOCK_SCHOOLS: School[] = [
  {
    id: 's1',
    name: 'Sunrise Academy',
    branch: 'Anna Nagar',
    board: 'CBSE',
    address: '12 Main Road, Anna Nagar, Chennai – 600 040',
  },
  {
    id: 's2',
    name: 'Heritage High School',
    branch: 'T Nagar',
    board: 'Stateboard',
    address: '45 Park Street, T Nagar, Chennai – 600 017',
  },
  {
    id: 's3',
    name: 'Green Valley School',
    branch: 'Velachery',
    board: 'CBSE',
    address: '8 Lake View Road, Velachery, Chennai – 600 042',
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
  },
  {
    id: 'u2',
    childName: 'Priya Sharma',
    age: 12,
    guardianContact: '9123456789',
    guardianEmail: 'sharma@gmail.com',
    weeklySession: 30,
    usageMode: 'general',
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
  },
];
