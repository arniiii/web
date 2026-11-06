import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store";
import { api, useMeQuery } from "../shared/api";
import { ErrorState, Spinner } from "../shared/ui";
import { signedOut } from "../features/auth/authSlice";
import { AuthPage } from "../features/auth/AuthPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { SubjectsPage } from "../features/subjects/SubjectsPage";
import { SubjectEditorPage } from "../features/subjects/SubjectForm";
import { SubjectDetailPage } from "../features/subjects/SubjectDetailPage";
import { TasksPage } from "../features/tasks/TasksPage";
import { TaskEditorPage } from "../features/tasks/TaskForm";
import { TaskDetailPage } from "../features/tasks/TaskDetailPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { Layout } from "./Layout";

function ProtectedRoute() {
  const token = useAppSelector((state) => state.auth.token);
  const { isLoading, error, refetch } = useMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });
  const location = useLocation();
  const dispatch = useAppDispatch();
  if (!token)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (isLoading) return <Spinner label="Проверяем сессию…" />;
  if (error)
    return (
      <div className="session-error">
        <ErrorState error={error} retry={refetch} />
        <button
          className="button secondary"
          onClick={() => {
            dispatch(signedOut());
            dispatch(api.util.resetApiState());
          }}
        >
          Вернуться ко входу
        </button>
      </div>
    );
  return <Outlet />;
}
export function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event("semester:ready"));
  }, [pathname]);
  return (
    <Routes>
      <Route path="/login" element={<AuthPage key="login" />} />
      <Route path="/register" element={<AuthPage key="register" register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<DashboardPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/new" element={<SubjectEditorPage />} />
          <Route path="/subjects/:id" element={<SubjectDetailPage />} />
          <Route path="/subjects/:id/edit" element={<SubjectEditorPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/new" element={<TaskEditorPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/tasks/:id/edit" element={<TaskEditorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="*"
            element={
              <div className="panel empty-state">
                <h1>Страница не найдена</h1>
                <p>Такого раздела нет в учебном плане.</p>
                <a className="button primary" href="/overview">
                  К обзору
                </a>
              </div>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
