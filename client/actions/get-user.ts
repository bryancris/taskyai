import type { User } from '@/types';
import { AxiosError } from 'axios';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

export const getUserByEmail = async (email: string) => {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  try {
    const response = await api.get<User>(`/api/Users/by-email/${email}`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) throw new Error(`Error fetching user by email: ${error.message}`);
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
    if (error instanceof AxiosError) throw new Error(`Error fetching user with id ${id}: ${error.message}`);
    throw error;
  }
};
