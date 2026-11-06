import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { api, useMeQuery, useTasksQuery } from "../shared/api";
import { useAppDispatch } from "./store";
import { signedOut } from "../features/auth/authSlice";
import { dateKey } from "../shared/dates";

export function Layout() {
  const { data: user } = useMeQuery();
  const { data: tasks = [] } = useTasksQuery();
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const section = location.pathname.startsWith("/subjects")
    ? "Дисциплины"
    : location.pathname.startsWith("/tasks")
      ? "Задания"
      : location.pathname === "/profile"
        ? "Профиль"
        : "Обзор";
  function logout() {
    dispatch(signedOut());
    dispatch(api.util.resetApiState());
    navigate("/login");
  }
  return (
    <div className="app-layout">
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link to="/overview" className="brand">
          семестр<span className="brand-period">.</span>
        </Link>
        <button
          className="icon-button sidebar-close"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        >
          Закрыть
        </button>
        <nav aria-label="Основная навигация">
          {[
            ["/overview", "Обзор"],
            ["/subjects", "Дисциплины"],
            ["/tasks", "Задания"],
            ["/profile", "Профиль"],
          ].map(([to, title]) => {
            return (
              <NavLink
                key={to as string}
                to={to as string}
                onClick={() => setOpen(false)}
              >
                <span>{title as string}</span>
                {to === "/tasks" && (
                  <span className="nav-count">
                    {tasks.filter((task) => task.status !== "done").length}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-account">
          <Link to="/profile" className="account-link">
            <span className="avatar">
              {user?.name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{user?.name}</strong>
              <small>{user?.study_group || "Студент"}</small>
            </span>
          </Link>
          <button
            className="icon-button"
            onClick={logout}
            aria-label="Выйти из аккаунта"
            title="Выйти"
          >
            Выйти
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              onClick={() => setOpen(true)}
              aria-label="Открыть меню"
            >
              Меню
            </button>
            <span>Мой семестр</span>
            <span aria-hidden="true">/</span>
            <strong>{section}</strong>
          </div>
          <div className="topbar-right">
            <time dateTime={dateKey()}>
              {new Date().toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
        </header>
        <main className="main-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
