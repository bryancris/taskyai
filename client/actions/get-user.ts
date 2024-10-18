import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { User } from '@/types';
import { AxiosError } from 'axios';

export const getUserByEmail = async (email: string) => {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  try {
    const response = await api.get<User>(`/api/Users/by-email/${email}`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) console.error('Error fetching user by email:', error.message);
    throw error;
  }
};

export const getUserById = async (id: string) => {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  try {
    const response = await api.get<User>(`/api/Users/${id}`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) console.error(`Error fetching user with id ${id}:`, error.message);
    throw error;
  }
};
