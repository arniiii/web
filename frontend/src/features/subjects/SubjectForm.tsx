import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, Save } from "lucide-react";
import {
  errorMessage,
  useCreateSubjectMutation,
  useSubjectQuery,
  useUpdateSubjectMutation,
} from "../../shared/api";
import type { Subject, SubjectInput } from "../../shared/types";
import {
  BackLink,
  ErrorState,
  FormError,
  PageHeader,
  Spinner,
} from "../../shared/ui";

const colors = [
  "#4c7666",
  "#8575b1",
  "#bd8050",
  "#577da3",
  "#b36875",
  "#8a8b4f",
];
function SubjectForm({ subject }: { subject?: Subject }) {
  const [data, setData] = useState<SubjectInput>(
    subject
      ? {
          title: subject.title,
          teacher: subject.teacher,
          color: subject.color,
          description: subject.description,
        }
      : { title: "", teacher: "", color: colors[0], description: "" },
  );
  const [error, setError] = useState("");
  const [create, createState] = useCreateSubjectMutation();
  const [update, updateState] = useUpdateSubjectMutation();
  const navigate = useNavigate();
  const busy = createState.isLoading || updateState.isLoading;
  const back = subject ? `/subjects/${subject.id}` : "/subjects";
  function field<K extends keyof SubjectInput>(key: K, value: SubjectInput[K]) {
    setData((old) => ({ ...old, [key]: value }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (data.title.trim().length < 2)
      return setError(
        "Название дисциплины должно содержать минимум 2 символа.",
      );
    try {
      const result = subject
        ? await update({ id: subject.id, data }).unwrap()
        : await create(data).unwrap();
      navigate(`/subjects/${result.id}`);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }
  return (
    <>
      <BackLink to={back}>К дисциплинам</BackLink>
      <PageHeader
        title={subject ? "Редактирование дисциплины" : "Новая дисциплина"}
      />
      <form
        className="panel editor-form stack-form"
        onSubmit={submit}
        noValidate
      >
        <label>
          Название дисциплины <span className="required">*</span>
          <input
            value={data.title}
            onChange={(e) => field("title", e.target.value)}
            placeholder="Например, Веб-программирование II"
            maxLength={120}
            required
          />
        </label>
        <label>
          Преподаватель
          <input
            value={data.teacher}
            onChange={(e) => field("teacher", e.target.value)}
            placeholder="Фамилия и инициалы"
            maxLength={120}
          />
        </label>
        <label>
          Описание
          <textarea
            rows={4}
            value={data.description}
            onChange={(e) => field("description", e.target.value)}
            placeholder="Что изучаем, важные ссылки или заметки о предмете"
            maxLength={1000}
          />
        </label>
        <fieldset className="color-picker">
          <legend>Цвет дисциплины</legend>
          <div>
            {colors.map((color, i) => (
              <label key={color} title={`Цвет ${i + 1}`}>
                <input
                  className="sr-only"
                  type="radio"
                  name="color"
                  value={color}
                  checked={data.color === color}
                  onChange={() => field("color", color)}
                />
                <span style={{ background: color }}>
                  {data.color === color && <Check size={18} />}
                </span>
                <span className="sr-only">Цвет {i + 1}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <FormError message={error} />
        <div className="form-actions">
          <Link className="button secondary" to={back}>
            Отмена
          </Link>
          <button className="button primary" disabled={busy}>
            <Save size={16} />
            {busy ? "Сохраняем…" : "Сохранить дисциплину"}
          </button>
        </div>
      </form>
    </>
  );
}
export function SubjectEditorPage() {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useSubjectQuery(Number(id), {
    skip: !id,
  });
  if (id && isLoading) return <Spinner />;
  if (id && error) return <ErrorState error={error} retry={refetch} />;
  if (id && !data) return <Spinner />;
  return <SubjectForm key={id || "new"} subject={data} />;
}
