import { AxiosError } from 'axios';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { SearchParamsOptions } from '@/lib/util/filter';
import { Task } from '@/types';

export const getTasks = async (options?: SearchParamsOptions) => {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  try {
    const queryParams = new URLSearchParams();

    if (options?.listId) {
      queryParams.append('listId', options.listId);
    }

    if (options?.today) {
      queryParams.append('today', 'true');
    } else if (options?.dueDate) {
      queryParams.append('dueDate', options.dueDate);
    }

    const response = await api.get<Task[]>(`/api/Tasks?${queryParams.toString()}`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) throw error;
    throw error;
  }
};

export const getTask = async (taskId: string) => {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  try {
    const response = await api.get<Task>(`/api/Tasks/${taskId}`);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) throw error;
    throw error;
  }
};
