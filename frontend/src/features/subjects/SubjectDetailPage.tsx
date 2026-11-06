import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import {
  errorMessage,
  useDeleteSubjectMutation,
  useSubjectQuery,
  useTasksQuery,
} from "../../shared/api";
import {
  BackLink,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from "../../shared/ui";
import { TaskList } from "../tasks/TaskList";

export function SubjectDetailPage() {
  const { id } = useParams();
  const subjectQuery = useSubjectQuery(Number(id));
  const tasksQuery = useTasksQuery({ subject_id: id });
  const [remove, { isLoading: removing }] = useDeleteSubjectMutation();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  if (subjectQuery.isLoading || tasksQuery.isLoading) return <Spinner />;
  if (subjectQuery.error || tasksQuery.error)
    return (
      <ErrorState
        error={subjectQuery.error || tasksQuery.error}
        retry={() => {
          subjectQuery.refetch();
          tasksQuery.refetch();
        }}
      />
    );
  const subject = subjectQuery.data;
  if (!subject) return null;
  async function deleteSubject() {
    setError("");
    try {
      await remove(Number(id)).unwrap();
      navigate("/subjects");
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }
  const progress = subject.task_count
    ? Math.round((subject.completed_count / subject.task_count) * 100)
    : 0;
  return (
    <>
      <BackLink to="/subjects">Все дисциплины</BackLink>
      <PageHeader
        eyebrow="КАРТОЧКА ДИСЦИПЛИНЫ"
        title={subject.title}
        subtitle={subject.teacher || "Преподаватель не указан"}
        actions={
          <>
            <Link className="button secondary" to={`/subjects/${id}/edit`}>
              <Pencil size={16} />
              Редактировать
            </Link>
            <button
              className="icon-button delete-button"
              onClick={() => {
                setError("");
                setConfirm(true);
              }}
              aria-label="Удалить дисциплину"
            >
              <Trash2 size={18} />
            </button>
          </>
        }
      />
      <section className="panel subject-summary">
        <span
          className="subject-icon large"
          style={{ color: subject.color, background: `${subject.color}14` }}
        >
          <BookOpen size={28} />
        </span>
        <div>
          <h2>О дисциплине</h2>
          <p className="preserve-lines">
            {subject.description || "Описание пока не добавлено."}
          </p>
        </div>
        <div className="subject-summary-progress">
          <strong>{progress}%</strong>
          <span>
            {subject.completed_count} из {subject.task_count} заданий выполнено
          </span>
          <div className="progress-track">
            <i style={{ width: `${progress}%`, background: subject.color }} />
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Задания дисциплины</h2>
          <Link className="button primary" to={`/tasks/new?subject_id=${id}`}>
            <Plus size={16} />
            Добавить задание
          </Link>
        </div>
        {tasksQuery.data?.length ? (
          <TaskList tasks={tasksQuery.data} />
        ) : (
          <EmptyState
            title="Заданий пока нет"
            text="Добавь первое задание по этой дисциплине."
          />
        )}
      </section>
      <ConfirmDialog
        open={confirm}
        title="Удалить дисциплину?"
        busy={removing}
        error={error}
        onClose={() => setConfirm(false)}
        onConfirm={deleteSubject}
      >
        {subject.task_count
          ? "В этой дисциплине есть задания. Сначала удали их или перенеси в другую дисциплину."
          : `Дисциплина «${subject.title}» будет удалена. Восстановить её не получится.`}
      </ConfirmDialog>
    </>
  );
}
