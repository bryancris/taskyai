import { AxiosResponse, AxiosError } from 'axios';
import { List } from '@/types';
import { api } from '@/lib/api';

interface ListEntry {
  name: string;
  description?: string;
}

export const ListService = {
  createList: async (list: ListEntry): Promise<List> => {
    try {
      const response: AxiosResponse = await api.post('/lists', list);
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to create list');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  getLists: async (): Promise<List[]> => {
    try {
      const response = await api.get('/lists');
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to fetch lists');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },

  getList: async (listId: string): Promise<List> => {
    try {
      const response: AxiosResponse = await api.get(`/lists/${listId}`);
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to fetch list');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },

  updateList: async (listId: string, updatedList: ListEntry): Promise<List> => {
    try {
      const response: AxiosResponse = await api.patch(
        `/lists/${listId}`,
        updatedList,
      );
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to update list');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },

  deleteList: async (listId: string): Promise<List> => {
    try {
      const response: AxiosResponse = await api.delete(`/lists/${listId}`);
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to delete list');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
};
