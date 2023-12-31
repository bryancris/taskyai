import SubtaskItem from '@/components/shared/subtask/subtask-item';
import { Progress } from '@/components/ui/progress';

import { SubtaskResponse, TaskResponse } from '@/types';
import { cn } from '@/lib/util/cn';

interface SubtaskListProps {
  task: TaskResponse;
  subtasks?: SubtaskResponse[];
  showSubtaskList: boolean;
}

export default function SubtaskList({
  subtasks,
  task,
  showSubtaskList,
}: SubtaskListProps) {
  const calculateProgress = (): number => {
    if (!subtasks || subtasks.length === 0) {
      return 0;
    }

    const completedSubtasks = subtasks.filter(
      (subtask) => subtask.isCompleted,
    ).length;
    const totalSubtasks = subtasks.length;
    const progress = (completedSubtasks / totalSubtasks) * 100;

    return progress;
  };

  return (
    <div
      className={cn('pl-6', subtasks?.length || showSubtaskList ? 'pt-4' : '')}
    >
      {subtasks?.length && subtasks.length > 0 ? (
        <Progress value={calculateProgress()} className="mb-2" />
      ) : null}
      {subtasks &&
        subtasks.map((subtask) => (
          <SubtaskItem key={subtask.id} task={task} subtask={subtask} />
        ))}
      {showSubtaskList && <SubtaskItem task={task} />}
    </div>
  );
}
