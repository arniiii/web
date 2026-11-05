import { useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Plus, Save } from "lucide-react";
import {
  errorMessage,
  useCreateTaskMutation,
  useSubjectsQuery,
  useTaskQuery,
  useUpdateTaskMutation,
} from "../../shared/api";
import { dateKey, priorityLabels, statusLabels } from "../../shared/dates";
import type {
  Subject,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from "../../shared/types";
import {
  BackLink,
  EmptyState,
  ErrorState,
  FormError,
  PageHeader,
  Spinner,
} from "../../shared/ui";

function TaskForm({
  task,
  subjects,
  initialSubject,
}: {
  task?: Task;
  subjects: Subject[];
  initialSubject: number;
}) {
  const [data, setData] = useState<TaskInput>(
    task
      ? {
          title: task.title,
          description: task.description,
          subject_id: task.subject_id,
          due_date: task.due_date,
          priority: task.priority,
          status: task.status,
        }
      : {
          title: "",
          description: "",
          subject_id: subjects.some((item) => item.id === initialSubject)
            ? initialSubject
            : subjects[0]?.id || 0,
          due_date: dateKey(),
          status: "todo",
          priority: "medium",
        },
  );
  const [error, setError] = useState("");
  const [create, createState] = useCreateTaskMutation();
  const [update, updateState] = useUpdateTaskMutation();
  const navigate = useNavigate();
  const back = task ? `/tasks/${task.id}` : "/tasks";
  const busy = createState.isLoading || updateState.isLoading;
  function field<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setData((old) => ({ ...old, [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (data.title.trim().length < 2)
      return setError("Название задания должно содержать минимум 2 символа.");
    if (!subjects.some((item) => item.id === data.subject_id))
      return setError("Выбери дисциплину из списка.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.due_date))
      return setError("Укажи корректную дату дедлайна.");
    try {
      const result = task
        ? await update({ id: task.id, data }).unwrap()
        : await create(data).unwrap();
      navigate(`/tasks/${result.id}`);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }
  return (
    <>
      <BackLink to={back}>К заданиям</BackLink>
      <PageHeader
        eyebrow="СЛЕДУЮЩИЙ ШАГ"
        title={task ? "Редактирование задания" : "Новое задание"}
        subtitle="Понятное название и конкретный срок — хорошее начало."
      />
      <form
        className="panel editor-form stack-form"
        onSubmit={submit}
        noValidate
      >
        <label>
          Название задания <span className="required">*</span>
          <input
            value={data.title}
            onChange={(e) => field("title", e.target.value)}
            placeholder="Например, Подготовить лабораторную работу № 3"
            maxLength={160}
            required
          />
        </label>
        <label>
          Описание
          <textarea
            rows={5}
            value={data.description}
            onChange={(e) => field("description", e.target.value)}
            placeholder="Что нужно сделать, на что обратить внимание, полезные ссылки"
            maxLength={3000}
          />
        </label>
        <div className="form-grid">
          <label>
            Дисциплина <span className="required">*</span>
            <select
              aria-label="Дисциплина"
              value={data.subject_id}
              onChange={(e) => field("subject_id", Number(e.target.value))}
              required
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Дедлайн <span className="required">*</span>
            <input
              aria-label="Дедлайн"
              type="date"
              onInput={(e) => field("due_date", e.currentTarget.value)}
              value={data.due_date}
              onChange={(e) => field("due_date", e.target.value)}
              required
            />
          </label>
          <label>
            Статус
            <select
              aria-label="Статус"
              value={data.status}
              onChange={(e) => field("status", e.target.value as TaskStatus)}
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Приоритет
            <select
              aria-label="Приоритет"
              value={data.priority}
              onChange={(e) =>
                field("priority", e.target.value as TaskPriority)
              }
            >
              {Object.entries(priorityLabels).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <FormError message={error} />
        <div className="form-actions">
          <Link className="button secondary" to={back}>
            Отмена
          </Link>
          <button className="button primary" disabled={busy}>
            <Save size={16} />
            {busy ? "Сохраняем…" : "Сохранить задание"}
          </button>
        </div>
      </form>
    </>
  );
}
export function TaskEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const task = useTaskQuery(Number(id), { skip: !id });
  const subjects = useSubjectsQuery();
  if ((id && task.isLoading) || subjects.isLoading) return <Spinner />;
  if (task.error || subjects.error)
    return (
      <ErrorState
        error={task.error || subjects.error}
        retry={() => {
          if (id) task.refetch();
          subjects.refetch();
        }}
      />
    );
  if (!subjects.data?.length)
    return (
      <div className="panel">
        <EmptyState
          title="Сначала добавь дисциплину"
          text="Каждое задание относится к предмету. Создай дисциплину, затем вернись к заданию."
          action={
            <Link className="button primary" to="/subjects/new">
              <Plus size={16} />
              Добавить дисциплину
            </Link>
          }
        />
      </div>
    );
  if (id && !task.data) return <Spinner />;
  return (
    <TaskForm
      key={id || "new"}
      task={task.data}
      subjects={subjects.data}
      initialSubject={Number(params.get("subject_id"))}
    />
  );
}
