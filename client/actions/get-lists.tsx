import { AxiosError } from 'axios';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { List } from '@/types';

export const getLists = async () => {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  try {
    const response = await api.get<List[]>('/api/Lists');
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) throw error;
    return [];
  }
};
