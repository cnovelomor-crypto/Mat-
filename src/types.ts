export type UserRole = 'parent' | 'child';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  parentId?: string;
  points?: number;
  linkingCode?: string;
}

export interface ExerciseResult {
  id?: string;
  childId: string;
  category: 'sumas' | 'restas' | 'multiplicaciones' | 'divisiones' | 'figuras';
  score: number;
  totalQuestions: number;
  starsEarned: number;
  timestamp: any;
}

export interface Reward {
  id?: string;
  title: string;
  cost: number;
  icon: string;
  isCustom?: boolean;
  parentId?: string;
}

export interface Redemption {
  id?: string;
  childId: string;
  rewardId: string;
  rewardTitle: string;
  status: 'pending' | 'completed';
  timestamp: any;
  parentId: string;
}

export interface ParentNotification {
  id?: string;
  parentId: string;
  message: string;
  childName: string;
  type: string;
  timestamp: any;
  read: boolean;
}
