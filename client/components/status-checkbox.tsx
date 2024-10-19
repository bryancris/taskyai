import * as React from 'react';

import toast from 'react-hot-toast';
import type { Subtask, Task } from '@/types';

import { Checkbox } from '@/components/ui/checkbox';
import { handleError } from '@/lib/util/error';

import { TaskService } from '@/services/task-service';
import { SubtaskService } from '@/services/subtask-service';

interface StatusCheckboxProps {
  task?: Task | null;
  subtask?: Subtask;
  className?: string;
  onStatusChange?: (isComplete: boolean) => void;
}

export default function StatusCheckbox({
  task,
  subtask,
  className,
  onStatusChange,
}: StatusCheckboxProps) {
  const isCompleted = task?.isComplete ?? subtask?.isComplete ?? false;

  if (!task && !subtask)
    return <Checkbox className={className} />;

  const onToggleStatus = async () => {
    try {
      const updatedStatus = !isCompleted;

      if (task && !subtask) {
        await TaskService.updateTask(task.id, {
          ...task,
          isComplete: updatedStatus,
        });
      } else if (subtask && task) {
        await SubtaskService.updateSubtask(task.id, subtask.id, {
          ...subtask,
          isComplete: updatedStatus,
        });
      }

      if (updatedStatus) {
        toast.success(task ? 'Task completed!' : 'Subtask completed!');
      } else {
        toast.success(task ? 'Task marked as incomplete!' : 'Subtask marked as incomplete!');
      }

      if (onStatusChange) {
        onStatusChange(updatedStatus);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const priorityClassnames: { [key: string]: string } = {
    LOW: 'border-sky-500 bg-sky-500/10',
    MEDIUM: 'border-yellow-500 bg-yellow-500/10',
    HIGH: 'border-red-500 bg-red-500/10',
  };

  return (
    <Checkbox
      checked={isCompleted}
      onCheckedChange={onToggleStatus}
      className={`${priorityClassnames[task?.priority || '']} ${className ?? ''}`}
    />
  );
}