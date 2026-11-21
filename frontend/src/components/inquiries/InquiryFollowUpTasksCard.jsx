import React, { useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Checkbox,
  Input,
  ShadcnButton as Button,
} from '../ui';

export default function InquiryFollowUpTasksCard({
  tasks = [],
  onToggleTask,
  onCreateTask,
  creating = false,
}) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !onCreateTask) return;
    const trimmed = title.trim();
    setTitle('');
    await onCreateTask(trimmed);
  };

  const pendingCount = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;

  return (
    <Card className="bg-surface border border-outline shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 border-b border-outline">
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-primary shrink-0" />
          <CardTitle className="text-base font-semibold text-on-surface">
            Follow-up Tasks
          </CardTitle>
        </div>
        <Badge variant="outline" className="tabular-nums">
          {pendingCount} pending
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {tasks.length > 0 ? (
            tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const checkboxId = `task-check-${task.id}`;
              return (
                <label
                  key={task.id}
                  htmlFor={checkboxId}
                  className="min-h-11 flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-variant/60 border border-outline cursor-pointer hover:bg-surface-variant transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      id={checkboxId}
                      checked={isCompleted}
                      onCheckedChange={() => onToggleTask && onToggleTask(task)}
                    />
                    <span
                      className={`text-sm truncate ${
                        isCompleted ? 'line-through text-on-surface-variant' : 'font-medium text-on-surface'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant tabular-nums shrink-0">
                    Due: {task.dueAt ? String(task.dueAt).substring(0, 10) : 'Soon'}
                  </span>
                </label>
              );
            })
          ) : (
            <p className="text-sm text-on-surface-variant py-2">
              No follow-up tasks scheduled yet.
            </p>
          )}
        </div>

        {onCreateTask && (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              aria-label="New follow-up task"
              placeholder="New follow-up task (e.g., Send deeded parking schematic)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 h-11"
            />
            <Button
              type="submit"
              disabled={creating || !title.trim()}
              className="h-11 shrink-0"
            >
              <Plus data-icon="inline-start" />
              <span>{creating ? 'Adding...' : 'Add Task'}</span>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
