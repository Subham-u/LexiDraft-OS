export interface ContractSummary {
  jurisdiction: string;
  id: number;
  title: string;
  status: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled';
  updatedAt: string;
  type: string;
}

export interface DashboardStats {
  totalContracts: number;
  drafts: number;
  signed: number;
  pending: number;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role?: string;
  avatar?: string;
}

export interface TemplateItem {
  id: number;
  title: string;
  description: string;
  type: string;
}
