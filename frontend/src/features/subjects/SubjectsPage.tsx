import { useState } from "react";
import { ArrowUpRight, BookOpen, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubjectsQuery } from "../../shared/api";
import { EmptyState, ErrorState, PageHeader, Spinner } from "../../shared/ui";

export function SubjectsPage() {
  const [search, setSearch] = useState("");
  const {
    data: subjects = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSubjectsQuery(search);
  return (
    <>
      <PageHeader
        eyebrow="УЧЕБНЫЙ ПЛАН"
        title="Мои дисциплины"
        subtitle="Каждому предмету — своё место, каждому заданию — понятный контекст."
        actions={
          <Link className="button primary" to="/subjects/new">
            <Plus size={17} />
            Добавить дисциплину
          </Link>
        }
      />
      <div className="toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Поиск дисциплин"
            value={search}
            maxLength={120}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти дисциплину…"
          />
        </label>
        <span className="muted" role="status">
          {isFetching ? "Обновляем…" : `Дисциплин: ${subjects.length}`}
        </span>
      </div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} retry={refetch} />
      ) : subjects.length ? (
        <div className="subjects-grid">
          {subjects.map((subject) => {
            const progress = subject.task_count
              ? Math.round((subject.completed_count / subject.task_count) * 100)
              : 0;
            return (
              <Link
                className="subject-card"
                to={`/subjects/${subject.id}`}
                key={subject.id}
              >
                <div className="subject-card-top">
                  <span
                    className="subject-icon"
                    style={{
                      color: subject.color,
                      background: `${subject.color}14`,
                    }}
                  >
                    <BookOpen size={23} />
                  </span>
                  <ArrowUpRight size={19} />
                </div>
                <h2>{subject.title}</h2>
                <p>{subject.teacher || "Преподаватель не указан"}</p>
                <div className="subject-description">
                  {subject.description ||
                    "Добавь задания и начни собирать учебный план."}
                </div>
                <div className="subject-progress-label">
                  <span>
                    {subject.completed_count} из {subject.task_count} заданий
                  </span>
                  <strong>{progress}%</strong>
                </div>
                <div className="progress-track">
                  <i
                    style={{
                      width: `${progress}%`,
                      backgroundColor: subject.color,
                    }}
                  />
                </div>
              </Link>
            );
          })}
          <Link className="add-subject-card" to="/subjects/new">
            <Plus size={27} />
            <span>Новая дисциплина</span>
            <small>Ещё один предмет в твоём плане</small>
          </Link>
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            title={search ? "Ничего не нашлось" : "С чего начнём этот семестр?"}
            text={
              search
                ? "Попробуй другое название или очисти поиск."
                : "Добавь первую дисциплину — потом к ней можно будет привязать задания."
            }
            action={
              search ? (
                <button
                  className="button secondary"
                  onClick={() => setSearch("")}
                >
                  Очистить поиск
                </button>
              ) : (
                <Link className="button primary" to="/subjects/new">
                  <Plus size={16} />
                  Добавить дисциплину
                </Link>
              )
            }
          />
        </div>
      )}
    </>
  );
}
