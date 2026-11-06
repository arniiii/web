import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCheck,
  Flag,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSubjectsQuery, useTasksQuery } from "../../shared/api";
import { dateKey, dayOffset, parseDate } from "../../shared/dates";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../../shared/ui";
import { TaskList } from "../tasks/TaskList";

export function DashboardPage() {
  const subjectsQuery = useSubjectsQuery();
  const tasksQuery = useTasksQuery();
  if (subjectsQuery.isLoading || tasksQuery.isLoading) return <Spinner />;
  if (subjectsQuery.error || tasksQuery.error)
    return (
      <ErrorState
        error={subjectsQuery.error || tasksQuery.error}
        retry={() => {
          subjectsQuery.refetch();
          tasksQuery.refetch();
        }}
      />
    );
  const subjects = subjectsQuery.data || [];
  const tasks = tasksQuery.data || [];
  const active = tasks.filter((task) => task.status !== "done");
  const done = tasks.length - active.length;
  const overdue = active.filter((task) => task.due_date < dateKey()).length;
  const week = active.filter(
    (task) => task.due_date >= dateKey() && task.due_date <= dayOffset(6),
  ).length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = active.slice(0, 5);
  return (
    <>
      <PageHeader
        title="Обзор семестра"
        actions={
          <Link className="button primary" to="/tasks/new">
            <Plus size={17} />
            Добавить задание
          </Link>
        }
      />
      <section className="stats-grid" aria-label="Статистика семестра">
        {[
          {
            label: "Дисциплины",
            value: subjects.length,
            icon: BookOpen,
            className: "sage",
            to: "/subjects",
          },
          {
            label: "Ближайшие 7 дней",
            value: week,
            icon: CalendarDays,
            className: "sand",
            to: `/tasks?due_after=${dateKey()}&due_before=${dayOffset(6)}&pending=true`,
          },
          {
            label: "Выполнено",
            value: done,
            text: `из ${tasks.length} заданий`,
            icon: CheckCheck,
            className: "lavender",
            to: "/tasks?status=done",
          },
          {
            label: "Просрочено",
            value: overdue,
            icon: Flag,
            className: "peach",
            to: `/tasks?due_before=${dayOffset(-1)}&pending=true`,
          },
        ].map((stat) => (
          <Link to={stat.to} className="stat-card" key={stat.label}>
            <div className="stat-top">
              <span>{stat.label}</span>
              <span className={`stat-icon ${stat.className}`}>
                <stat.icon size={18} />
              </span>
            </div>
            <strong>{stat.value.toString().padStart(2, "0")}</strong>
            {stat.text && <small>{stat.text}</small>}
          </Link>
        ))}
      </section>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  Ближайшие задания{" "}
                  <span className="heading-count">{active.length}</span>
                </h2>
              </div>
              <Link className="text-link" to="/tasks">
                Все задания <ArrowRight size={15} />
              </Link>
            </div>
            {upcoming.length ? (
              <TaskList tasks={upcoming} />
            ) : (
              <EmptyState
                title={
                  tasks.length ? "Все задания выполнены" : "Заданий пока нет"
                }
                text={
                  tasks.length
                    ? "Новые задания можно добавить в учебный план."
                    : "Добавь дисциплину и задание."
                }
                action={
                  <Link
                    className="button secondary"
                    to={subjects.length ? "/tasks/new" : "/subjects/new"}
                  >
                    <Plus size={16} />
                    {subjects.length
                      ? "Добавить задание"
                      : "Добавить дисциплину"}
                  </Link>
                }
              />
            )}
          </section>
          <section className="panel subjects-preview">
            <div className="panel-heading">
              <div>
                <h2>Мои дисциплины</h2>
              </div>
              <Link className="text-link" to="/subjects">
                Все дисциплины <ArrowRight size={15} />
              </Link>
            </div>
            {subjects.length ? (
              <div className="subject-preview-grid">
                {subjects.slice(0, 4).map((subject) => (
                  <Link
                    className="subject-mini"
                    key={subject.id}
                    to={`/subjects/${subject.id}`}
                  >
                    <span
                      className="subject-icon"
                      style={{
                        backgroundColor: `${subject.color}14`,
                        color: subject.color,
                      }}
                    >
                      <BookOpen size={19} />
                    </span>
                    <span>
                      <strong>{subject.title}</strong>
                      <small>
                        {subject.completed_count} / {subject.task_count} заданий
                        выполнено
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Дисциплин пока нет"
                text="Добавь дисциплину, чтобы создавать задания."
                action={
                  <Link className="text-link" to="/subjects/new">
                    Добавить дисциплину <ArrowRight size={15} />
                  </Link>
                }
              />
            )}
          </section>
        </div>
        <aside className="dashboard-aside">
          <section className="panel week-panel">
            <div className="panel-heading">
              <h2>Ближайшие 7 дней</h2>
              <CalendarDays size={19} />
            </div>
            <p className="muted calendar-month">
              {new Date().toLocaleDateString("ru-RU", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="week-strip">
              {Array.from({ length: 7 }, (_, i) => {
                const key = dayOffset(i);
                const date = parseDate(key);
                const count = active.filter(
                  (task) => task.due_date === key,
                ).length;
                return (
                  <Link
                    to={`/tasks?due_before=${key}`}
                    key={key}
                    className={`week-day ${i === 0 ? "today" : ""}`}
                    aria-label={`Задания до ${key}: ${count}`}
                  >
                    <small>
                      {date.toLocaleDateString("ru-RU", { weekday: "short" })}
                    </small>
                    <strong>{date.getDate()}</strong>
                    <i className={count ? "has-tasks" : ""} />
                  </Link>
                );
              })}
            </div>
            <div className="calendar-caption">
              <i />
              Точка — день с дедлайном
            </div>
          </section>
          <section className="panel progress-panel">
            <h2>Прогресс семестра</h2>
            <div
              className="progress-ring"
              style={{
                background: `conic-gradient(var(--green) ${progress}%, #edf0e8 0)`,
              }}
              role="img"
              aria-label={`Выполнено ${progress}% заданий`}
            >
              <div>
                <strong>
                  {progress}
                  <span>%</span>
                </strong>
                <small>выполнено</small>
              </div>
            </div>
            <p>
              {tasks.length
                ? `${done} из ${tasks.length} заданий выполнено`
                : "Заданий пока нет"}
            </p>
            <div className="progress-legend">
              <span>
                <i className="legend-done" />
                Готово <b>{done}</b>
              </span>
              <span>
                <i />
                Впереди <b>{active.length}</b>
              </span>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
