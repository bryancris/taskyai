import { AxiosResponse, AxiosError } from 'axios';
import { api } from '@/lib/api';
import { Task, TaskEntry } from '@/types';
import { SearchParamsOptions, queryParamsMapping } from '@/lib/util/filter';

interface TaskLabelRelation {
  labelId: string;
  taskId: string;
}

export const TaskService = {
  createTask: async (task: TaskEntry) => {
    try {
      const response: AxiosResponse<Task> = await api.post('/tasks', task);
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to create task');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  // Define default value for the entire argument using Partial
  getTasks: async (
    params: Partial<SearchParamsOptions> = {},
  ): Promise<Task[]> => {
    try {
      const queryParams: { [key: string]: string | boolean | number } = {};

      // Loop through each [param, queryParam] pair in the queryParamsMapping object
      // eslint-disable-next-line no-restricted-syntax
      for (const [param, queryParam] of Object.entries(queryParamsMapping)) {
        // Extract the value of the current parameter from the params object
        const paramValue = params[param as keyof SearchParamsOptions];

        // Check if the extracted parameter value is not undefined
        if (paramValue !== undefined) {
          // Assign the non-undefined parameter value to the corresponding property in the queryParams object
          queryParams[queryParam] = paramValue;
        }
      }

      const response: AxiosResponse = await api.get('/tasks', {
        params: queryParams,
      });

      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to fetch tasks');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  getTask: async (taskId: string): Promise<Task> => {
    try {
      const response: AxiosResponse = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to fetch task');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  updateTask: async (taskId: string, updatedTask: TaskEntry): Promise<Task> => {
    try {
      const response: AxiosResponse = await api.patch(
        `/tasks/${taskId}`,
        updatedTask,
      );
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to update task');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  deleteTask: async (taskId: string): Promise<Task> => {
    try {
      const response: AxiosResponse = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to delete task');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  addLabel: async ({ taskId, labelId }: TaskLabelRelation): Promise<void> => {
    try {
      const response: AxiosResponse = await api.post(
        `/tasks/${taskId}/labels/${labelId}`,
        null,
      );
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to add label to task');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
  removeLabel: async ({
    labelId,
    taskId,
  }: TaskLabelRelation): Promise<void> => {
    try {
      const response: AxiosResponse = await api.delete(
        `/tasks/${taskId}/labels/${labelId}`,
      );
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        throw new Error(err.response?.data?.message || 'Failed to remove label from task');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },
};
