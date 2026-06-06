export type UserRole = 'buyer' | 'seller';

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
  createdAt?: string;
};
