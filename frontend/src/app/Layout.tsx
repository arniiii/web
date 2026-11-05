import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BookOpen,
  CheckCheck,
  ChevronRight,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Plus,
  UserRound,
  X,
} from "lucide-react";
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
  const done = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
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
          <span className="brand-icon">
            <Layers3 size={23} />
          </span>
          семестр<span className="brand-period">.</span>
        </Link>
        <button
          className="icon-button sidebar-close"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="workspace-label">ЛИЧНОЕ ПРОСТРАНСТВО</div>
        <nav aria-label="Основная навигация">
          {[
            ["/overview", "Обзор", LayoutDashboard],
            ["/subjects", "Дисциплины", BookOpen],
            ["/tasks", "Задания", CheckCheck],
            ["/profile", "Профиль", UserRound],
          ].map(([to, title, Icon]) => {
            const NavIcon = Icon as typeof BookOpen;
            return (
              <NavLink
                key={to as string}
                to={to as string}
                onClick={() => setOpen(false)}
              >
                <NavIcon size={19} />
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
        <div className="sidebar-progress">
          <span className="sidebar-progress-icon">✦</span>
          <h3>Шаг за шагом</h3>
          <p>
            {tasks.length
              ? `${done} из ${tasks.length} заданий уже позади`
              : "Каждое выполненное задание приближает к цели"}
          </p>
          <div className="progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}% учебного плана</span>
        </div>
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
            <LogOut size={18} />
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
              <Menu size={21} />
            </button>
            <span>Мой семестр</span>
            <ChevronRight size={13} />
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
            <Link
              className="topbar-add"
              to="/tasks/new"
              aria-label="Добавить задание"
            >
              <Plus size={19} />
            </Link>
          </div>
        </header>
        <main className="main-content" id="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Семестр — всё важное на своём месте.</span>
          <span>Твой план. Твой ритм.</span>
        </footer>
      </div>
    </div>
  );
}
