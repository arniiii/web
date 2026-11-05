import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Layers3,
} from "lucide-react";
import {
  api,
  errorMessage,
  useLoginMutation,
  useRegisterMutation,
} from "../../shared/api";
import { useAppDispatch, useAppSelector } from "../../app/store";
import { signedIn } from "./authSlice";
import { FormError } from "../../shared/ui";

export function AuthPage({ register = false }: { register?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [login, loginState] = useLoginMutation();
  const [createAccount, registerState] = useRegisterMutation();
  const { token, expired } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const busy = loginState.isLoading || registerState.isLoading;
  if (token) return <Navigate to="/overview" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (register && name.trim().length < 2)
      return setError("Введите имя: не менее двух символов.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Введите корректный адрес электронной почты.");
    if (password.length < (register ? 8 : 1))
      return setError(
        register
          ? "Пароль должен содержать минимум 8 символов."
          : "Введите пароль.",
      );
    try {
      const result = register
        ? await createAccount({
            name: name.trim(),
            email: email.trim(),
            password,
          }).unwrap()
        : await login({ email: email.trim(), password }).unwrap();
      dispatch(api.util.resetApiState());
      dispatch(signedIn(result.access_token));
      const from = (location.state as { from?: string } | null)?.from;
      navigate(
        from?.startsWith("/") && !from.startsWith("//") ? from : "/overview",
        { replace: true },
      );
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Link to="/login" className="brand">
          <span className="brand-icon">
            <Layers3 size={23} />
          </span>
          семестр<span className="brand-period">.</span>
        </Link>
        <div className="auth-story-content">
          <span className="story-kicker">ТВОЙ УЧЕБНЫЙ РИТМ</span>
          <h1>
            Большие цели.
            <br />
            <em>Понятные шаги.</em>
          </h1>
          <p>
            Собери дисциплины, задания и дедлайны в одном спокойном
            пространстве.
          </p>
          <div className="notebook">
            <div className="notebook-heading">
              <BookOpen size={20} />
              <span>Всё идёт по плану</span>
              <span className="notebook-dots">•••</span>
            </div>
            {[
              "Дисциплины — под рукой",
              "Дедлайны — перед глазами",
              "Прогресс — каждый день",
            ].map((item) => (
              <div className="notebook-row" key={item}>
                <span>
                  <Check size={15} />
                </span>
                {item}
              </div>
            ))}
            <div className="notebook-line">
              <i />
              <span>Меньше хаоса. Больше ясности.</span>
            </div>
          </div>
        </div>
        <p className="auth-footnote">
          Учись в своём темпе. Держи главное в фокусе.
        </p>
      </aside>
      <main className="auth-main" id="main-content">
        <div className="auth-switch">
          {register ? "Уже есть аккаунт?" : "Впервые здесь?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Войти" : "Создать аккаунт"} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="auth-form-wrap">
          <p className="eyebrow">ТВОЁ УЧЕБНОЕ ПРОСТРАНСТВО</p>
          <h2>{register ? "Начнём новый семестр" : "С возвращением"}</h2>
          <p className="page-subtitle">
            {register
              ? "Создай аккаунт и составь свой первый учебный план."
              : "Войди, чтобы вернуться к своим планам."}
          </p>
          {expired && (
            <p className="notice" role="status">
              Сессия истекла. Войди ещё раз, чтобы продолжить.
            </p>
          )}
          <form onSubmit={submit} noValidate className="stack-form">
            {register && (
              <label>
                Как тебя зовут
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Твоё имя"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}
            <label>
              Электронная почта
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                maxLength={254}
                required
              />
            </label>
            <label>
              Пароль
              <div className="password-input">
                <input
                  aria-label="Пароль"
                  type={visible ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    register ? "Не менее 8 символов" : "Введи пароль"
                  }
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <FormError message={error} />
            <button className="button primary auth-submit" disabled={busy}>
              {busy
                ? "Подождите…"
                : register
                  ? "Создать аккаунт"
                  : "Войти в аккаунт"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-note">Твои планы доступны только тебе.</p>
        </div>
        <span className="auth-copyright">
          Семестр · Личный учебный планировщик
        </span>
      </main>
    </div>
  );
}
