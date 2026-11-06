import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

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
      <main className="auth-main" id="main-content">
        <div className="auth-header">
          <Link to="/login" className="brand">
            семестр<span className="brand-period">.</span>
          </Link>
          <div className="auth-switch">
            <Link to={register ? "/login" : "/register"}>
              {register ? "Войти" : "Создать аккаунт"}
            </Link>
          </div>
        </div>
        <div className="auth-form-wrap">
          <h1>{register ? "Регистрация" : "Вход"}</h1>
          {expired && (
            <p className="notice" role="status">
              Сессия истекла. Войди ещё раз, чтобы продолжить.
            </p>
          )}
          <form onSubmit={submit} noValidate className="stack-form">
            {register && (
              <label>
                Имя
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя"
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
                  {visible ? "Скрыть" : "Показать"}
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
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
