import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useSubjectsQuery, useTasksQuery } from "../../shared/api";
import { fullDate, priorityLabels, statusLabels } from "../../shared/dates";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../../shared/ui";
import { TaskList } from "./TaskList";

export function TasksPage() {
  const [params, setParams] = useSearchParams();
  const searchFromUrl = params.get("search") || "";
  const [search, setSearch] = useState(searchFromUrl);
  useEffect(() => {
    setSearch(searchFromUrl);
  }, [searchFromUrl]);
  useEffect(() => {
    if (search === searchFromUrl) return;
    const timer = setTimeout(
      () =>
        setParams(
          (current) => {
            const next = new URLSearchParams(current);
            if (search) next.set("search", search);
            else next.delete("search");
            return next;
          },
          { replace: true },
        ),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, searchFromUrl, setParams]);
  const { data: subjects = [] } = useSubjectsQuery();
  const filters = Object.fromEntries(params);
  const {
    data: tasks = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTasksQuery(filters);
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (search) next.set("search", search);
    else next.delete("search");
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <>
      <PageHeader
        title="Мои задания"
        actions={
          <Link className="button primary" to="/tasks/new">
            <Plus size={17} />
            Добавить задание
          </Link>
        }
      />
      <section className="panel tasks-panel">
        <div className="task-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Поиск заданий"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={160}
              placeholder="Найти задание…"
            />
          </label>
          <label className="sort-label">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Сортировка"
              value={params.get("sort") || "due_date"}
              onChange={(e) => change("sort", e.target.value)}
            >
              <option value="due_date">По дедлайну</option>
              <option value="priority">По приоритету</option>
              <option value="created_at">Сначала новые</option>
            </select>
          </label>
        </div>
        <div className="filter-bar">
          <label>
            Дисциплина
            <select
              aria-label="Фильтр по дисциплине"
              value={params.get("subject_id") || ""}
              onChange={(e) => change("subject_id", e.target.value)}
            >
              <option value="">Все дисциплины</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Статус
            <select
              aria-label="Фильтр по статусу"
              value={params.get("status") || ""}
              onChange={(e) => change("status", e.target.value)}
            >
              <option value="">Все статусы</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Приоритет
            <select
              aria-label="Фильтр по приоритету"
              value={params.get("priority") || ""}
              onChange={(e) => change("priority", e.target.value)}
            >
              <option value="">Любой приоритет</option>
              {Object.entries(priorityLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Дедлайн до
            <input
              type="date"
              aria-label="Дедлайн до"
              onInput={(e) => change("due_before", e.currentTarget.value)}
              value={params.get("due_before") || ""}
              onChange={(e) => change("due_before", e.target.value)}
            />
          </label>
        </div>
        <div className="filter-summary">
          <span className="muted" role="status">
            {isFetching
              ? "Обновляем список…"
              : `Найдено заданий: ${tasks.length}`}
          </span>
          <div>
            {params.get("pending") === "true" && (
              <span className="filter-chip">
                Невыполненные
                <button
                  className="icon-button"
                  aria-label="Убрать фильтр невыполненных"
                  onClick={() => change("pending", "")}
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {params.get("due_after") && (
              <span className="filter-chip">
                От {fullDate(params.get("due_after")!)}
                <button
                  className="icon-button"
                  aria-label="Убрать нижнюю границу даты"
                  onClick={() => change("due_after", "")}
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {params.size > 0 && (
              <button
                className="text-link"
                onClick={() => {
                  setSearch("");
                  setParams({});
                }}
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} retry={refetch} />
        ) : tasks.length ? (
          <TaskList tasks={tasks} />
        ) : (
          <EmptyState
            title={params.size ? "Подходящих заданий нет" : "Заданий пока нет"}
            text={
              params.size
                ? "Измени условия поиска или сбрось фильтры."
                : "Добавь задание, выбери дисциплину и установи дедлайн."
            }
            action={
              params.size ? (
                <button
                  className="button secondary"
                  onClick={() => {
                    setSearch("");
                    setParams({});
                  }}
                >
                  Сбросить фильтры
                </button>
              ) : (
                <Link className="button primary" to="/tasks/new">
                  <Plus size={16} />
                  Первое задание
                </Link>
              )
            }
          />
        )}
      </section>
    </>
  );
}
