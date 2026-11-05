import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckCheck, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { errorMessage, useDeleteTaskMutation, useTaskQuery, useTaskStatusMutation } from '../../shared/api';
import { dateKey, fullDate, priorityLabels, statusLabels } from '../../shared/dates';
import { BackLink, ConfirmDialog, ErrorState, FormError, PageHeader, Spinner } from '../../shared/ui';

export function TaskDetailPage() {
  const { id } = useParams();
  const { data: task, isLoading, error, refetch } = useTaskQuery(Number(id));
  const [updateStatus, statusState] = useTaskStatusMutation();
  const [remove, removeState] = useDeleteTaskMutation();
  const [confirm, setConfirm] = useState(false);
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorState error={error} retry={refetch} />;
  if (!task) return null;
  async function toggle() {
    if (!task) return;
    setActionError('');
    try { await updateStatus({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' }).unwrap(); }
    catch (reason) { setActionError(errorMessage(reason)); }
  }
  async function deleteTask() {
    setActionError('');
    try { await remove(Number(id)).unwrap(); navigate('/tasks'); }
    catch (reason) { setActionError(errorMessage(reason)); }
  }
  return <><BackLink to="/tasks">Все задания</BackLink><PageHeader eyebrow="КАРТОЧКА ЗАДАНИЯ" title={task.title} actions={<><Link className="button secondary" to={`/tasks/${id}/edit`}><Pencil size={16} />Редактировать</Link><button className="icon-button delete-button" aria-label="Удалить задание" onClick={() => { setActionError(''); setConfirm(true); }}><Trash2 size={18} /></button></>} />
    <div className="task-detail-grid"><section className="panel task-description"><div className="detail-topline"><span className={`status-badge status-${task.status}`}>{statusLabels[task.status]}</span><span className={`priority priority-${task.priority}`}><i />{priorityLabels[task.priority]} приоритет</span></div><h2>Что нужно сделать</h2><p className="preserve-lines">{task.description || 'Описание не добавлено. Его можно заполнить при редактировании.'}</p><div className="task-detail-actions"><FormError message={confirm ? '' : actionError} /><button className={`button ${task.status === 'done' ? 'secondary' : 'primary'}`} disabled={statusState.isLoading} onClick={toggle}>{task.status === 'done' ? <RotateCcw size={17} /> : <CheckCheck size={17} />}{statusState.isLoading ? 'Обновляем…' : task.status === 'done' ? 'Вернуть к выполнению' : 'Отметить выполненным'}</button></div></section>
      <aside className="panel task-properties"><h2>Детали задания</h2><div><span><BookOpen size={16} />Дисциплина</span><Link to={`/subjects/${task.subject_id}`}><i className="color-dot" style={{ background: task.subject_color }} />{task.subject_title}</Link></div><div><span><CalendarDays size={16} />Дедлайн</span><strong>{fullDate(task.due_date)}</strong>{task.status !== 'done' && task.due_date < dateKey() && <small className="overdue">Срок прошёл — задание ждёт внимания</small>}</div><div><span>Добавлено</span><strong>{new Date(task.created_at).toLocaleDateString('ru-RU')}</strong></div></aside></div>
    <ConfirmDialog open={confirm} title="Удалить задание?" busy={removeState.isLoading} error={actionError} onClose={() => setConfirm(false)} onConfirm={deleteTask}>Задание «{task.title}» будет удалено. Восстановить его не получится.</ConfirmDialog>
  </>;
}
