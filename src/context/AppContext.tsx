import React, { createContext, useContext, useState, useEffect } from 'react';
import { SESSION_KEY, PROFILE_KEY, MOCK_CHILD_PROFILE } from '@/mock/userData';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  dob: string;
  email: string;
  phone: string;
  avatar: string;
  interests: string[];
  weeklySession: number;
  guardianPhone: string;
  passwordEnv: string;
  passwordAnimal: string;
  joinedDate: string;
  skills: { listening: number; reading: number; thinking: number; imagination: number };
  level: number;
  stars: number;
  streak: number;
}

interface AppContextType {
  isLoggedIn: boolean;
  isRegistered: boolean;
  profile: ChildProfile | null;
  login: () => void;
  logout: () => void;
  register: (data: Partial<ChildProfile>) => void;
  updateProfile: (data: Partial<ChildProfile>) => void;
  assessmentProgress: Record<string, unknown>;
  saveAssessmentProgress: (data: Record<string, unknown>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (session === 'active' && savedProfile) {
      setIsLoggedIn(true);
      setIsRegistered(true);
      setProfile(JSON.parse(savedProfile));
    } else if (savedProfile) {
      setIsRegistered(true);
      setProfile(JSON.parse(savedProfile));
    }
    const savedProgress = localStorage.getItem('yellowowl_assessment_progress');
    if (savedProgress) {
      setAssessmentProgress(JSON.parse(savedProgress));
    }
  }, []);

  const login = () => {
    localStorage.setItem(SESSION_KEY, 'active');
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  };

  const register = (data: Partial<ChildProfile>) => {
    const newProfile = { ...MOCK_CHILD_PROFILE, ...data };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    setProfile(newProfile);
    setIsRegistered(true);
  };

  const updateProfile = (data: Partial<ChildProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    setProfile(updated);
  };

  const saveAssessmentProgress = (data: Record<string, unknown>) => {
    const updated = { ...assessmentProgress, ...data };
    localStorage.setItem('yellowowl_assessment_progress', JSON.stringify(updated));
    setAssessmentProgress(updated);
  };

  return (
    <AppContext.Provider value={{
      isLoggedIn, isRegistered, profile, login, logout,
      register, updateProfile, assessmentProgress, saveAssessmentProgress,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
