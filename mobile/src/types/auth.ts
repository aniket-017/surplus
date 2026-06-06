export type UserRole = 'buyer' | 'seller';

export type UserAddress = {
  address?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
  address: UserAddress | null;
  createdAt?: string;
};

export type UpdateProfilePayload = {
  name?: string;
  address?: UserAddress | null;
};
