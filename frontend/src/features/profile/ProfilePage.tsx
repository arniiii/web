import { useState, type FormEvent } from "react";
import { Check, Save } from "lucide-react";
import {
  errorMessage,
  useMeQuery,
  useUpdateProfileMutation,
} from "../../shared/api";
import { FormError, PageHeader } from "../../shared/ui";
import type { User } from "../../shared/types";

function ProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [university, setUniversity] = useState(user.university);
  const [group, setGroup] = useState(user.study_group);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [update, { isLoading }] = useUpdateProfileMutation();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (name.trim().length < 2)
      return setError("Имя должно содержать минимум 2 символа.");
    try {
      await update({
        name: name.trim(),
        university: university.trim(),
        study_group: group.trim(),
      }).unwrap();
      setSaved(true);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }
  return (
    <form className="panel editor-form stack-form" onSubmit={submit} noValidate>
      <div className="profile-heading">
        <span className="avatar large">{user.name[0].toUpperCase()}</span>
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
        </div>
      </div>
      <label>
        Имя <span className="required">*</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          maxLength={80}
          required
        />
      </label>
      <label>
        Учебное заведение
        <input
          value={university}
          onChange={(e) => {
            setUniversity(e.target.value);
            setSaved(false);
          }}
          maxLength={160}
          placeholder="Название университета"
        />
      </label>
      <label>
        Учебная группа
        <input
          value={group}
          onChange={(e) => {
            setGroup(e.target.value);
            setSaved(false);
          }}
          maxLength={40}
          placeholder="Например, БПИ-31"
        />
      </label>
      <FormError message={error} />
      {saved && (
        <p className="success-message" role="status">
          <Check size={16} />
          Изменения сохранены
        </p>
      )}
      <div className="form-actions">
        <button className="button primary" disabled={isLoading}>
          <Save size={16} />
          {isLoading ? "Сохраняем…" : "Сохранить изменения"}
        </button>
      </div>
    </form>
  );
}
export function ProfilePage() {
  const { data: user } = useMeQuery();
  return (
    <>
      <PageHeader
        eyebrow="ЛИЧНОЕ ПРОСТРАНСТВО"
        title="Мой профиль"
        subtitle="Немного о тебе и твоём учебном пути."
      />
      {user && <ProfileForm key={user.id} user={user} />}
    </>
  );
}
