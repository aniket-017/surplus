export type UserRole = 'buyer' | 'seller';

export type UserAddress = {
  address?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
  address: UserAddress | null;
  createdAt?: string;
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string | null;
  address?: UserAddress | null;
};
