export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: number;
  title: string;
  file: string;
  file_url: string;
  version: number;
  status: 'draft' | 'pending_signature' | 'signed' | 'final';
  uploaded_by: number;
  uploaded_by_name: string;
  meeting: number | null;
  signature_image: string | null;
  signature_url: string | null;
  signed_by: number | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface MeetingUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  profile_picture: string;
}

export interface Meeting {
  id: number;
  organizer: MeetingUser;
  participant: number;
  participant_detail: MeetingUser;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: MeetingStatus;
  room_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}