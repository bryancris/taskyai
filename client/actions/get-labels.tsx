import { AxiosError } from 'axios';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { Label } from '@/types';

export const getLabels = async () => {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  try {
    const response = await api.get<Label[]>('/api/Labels');
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) throw error;
    return [];
  }
};