import { useState } from 'react';
import { ArrowUpRight, Check, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { errorMessage, useTaskStatusMutation } from '../../shared/api';
import { dateKey, priorityLabels, shortDate, statusLabels } from '../../shared/dates';
import type { Task } from '../../shared/types';
import { FormError } from '../../shared/ui';

export function TaskRow({ task }: { task: Task }) {
  const [update, { isLoading }] = useTaskStatusMutation();
  const [error, setError] = useState('');
  const overdue = task.status !== 'done' && task.due_date < dateKey();
  async function toggle() {
    setError('');
    try { await update({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' }).unwrap(); }
    catch (reason) { setError(errorMessage(reason)); }
  }
  return <li className={`task-list-item ${task.status === 'done' ? 'task-done' : ''}`}>
    <div className="task-row"><button className={`task-check ${task.status === 'done' ? 'checked' : ''}`} disabled={isLoading} onClick={toggle} aria-label={`${task.status === 'done' ? 'Вернуть в работу' : 'Выполнить'}: ${task.title}`} aria-pressed={task.status === 'done'}>{task.status === 'done' && <Check size={14} />}</button>
      <div className="task-name"><Link className="task-title" to={`/tasks/${task.id}`}>{task.title}</Link><div className="task-meta"><Link to={`/subjects/${task.subject_id}`}><span className="color-dot" style={{ background: task.subject_color }} />{task.subject_title}</Link>{task.status === 'in_progress' && <span className="inline-status">{statusLabels[task.status]}</span>}</div></div>
      <span className={`task-date ${overdue ? 'overdue' : ''}`}><Clock3 size={13} />{task.due_date === dateKey() ? 'Сегодня' : shortDate(task.due_date)}{overdue && <small>Просрочено</small>}</span>
      <span className={`priority priority-${task.priority}`}><i />{priorityLabels[task.priority]}</span><Link className="icon-button task-open" to={`/tasks/${task.id}`} aria-label={`Открыть: ${task.title}`}><ArrowUpRight size={17} /></Link>
    </div><FormError message={error} />
  </li>;
}
export function TaskList({ tasks }: { tasks: Task[] }) {
  return <div className="task-list"><div className="task-list-heading"><span>ЗАДАНИЕ</span><span>ДЕДЛАЙН</span><span>ПРИОРИТЕТ</span></div><ul>{tasks.map((task) => <TaskRow key={task.id} task={task} />)}</ul></div>;
}
