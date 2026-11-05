// All HTTP access lives here. Forms and pages use generated RTK Query hooks.
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { sessionExpired, type AuthState } from "../features/auth/authSlice";
import type {
  AuthResponse,
  User,
  Subject,
  SubjectInput,
  Task,
  TaskInput,
  TaskFilters,
  TaskStatus,
} from "./types";

const rawQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  prepareHeaders(headers, { getState }) {
    const token = (getState() as { auth: AuthState }).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});
const query: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, context, extra) => {
  const result = await rawQuery(args, context, extra);
  const url = typeof args === "string" ? args : args.url;
  if (
    result.error?.status === 401 &&
    !["/auth/login", "/auth/register"].includes(url)
  ) {
    context.dispatch(sessionExpired());
    context.dispatch(api.util.resetApiState());
  }
  return result;
};
function params(filters: Record<string, string | undefined>) {
  return new URLSearchParams(
    Object.entries(filters).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  ).toString();
}
export const api = createApi({
  reducerPath: "api",
  baseQuery: query,
  tagTypes: ["User", "Subject", "Task"],
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    register: build.mutation<
      AuthResponse,
      { name: string; email: string; password: string }
    >({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    me: build.query<User, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    updateProfile: build.mutation<
      User,
      Pick<User, "name" | "university" | "study_group">
    >({
      query: (body) => ({ url: "/auth/me", method: "PUT", body }),
      invalidatesTags: ["User"],
    }),
    subjects: build.query<Subject[], string | void>({
      query: (search) => `/subjects?${params({ search: search || undefined })}`,
      providesTags: ["Subject"],
    }),
    subject: build.query<Subject, number>({
      query: (id) => `/subjects/${id}`,
      providesTags: ["Subject"],
    }),
    createSubject: build.mutation<Subject, SubjectInput>({
      query: (body) => ({ url: "/subjects", method: "POST", body }),
      invalidatesTags: ["Subject"],
    }),
    updateSubject: build.mutation<Subject, { id: number; data: SubjectInput }>({
      query: ({ id, data }) => ({
        url: `/subjects/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Subject", "Task"],
    }),
    deleteSubject: build.mutation<void, number>({
      query: (id) => ({ url: `/subjects/${id}`, method: "DELETE" }),
      invalidatesTags: ["Subject"],
    }),
    tasks: build.query<Task[], TaskFilters | void>({
      query: (filters) => `/tasks?${params({ ...filters })}`,
      providesTags: ["Task"],
    }),
    task: build.query<Task, number>({
      query: (id) => `/tasks/${id}`,
      providesTags: ["Task"],
    }),
    createTask: build.mutation<Task, TaskInput>({
      query: (body) => ({ url: "/tasks", method: "POST", body }),
      invalidatesTags: ["Task", "Subject"],
    }),
    updateTask: build.mutation<Task, { id: number; data: TaskInput }>({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Task", "Subject"],
    }),
    taskStatus: build.mutation<Task, { id: number; status: TaskStatus }>({
      query: ({ id, status }) => ({
        url: `/tasks/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Task", "Subject"],
    }),
    deleteTask: build.mutation<void, number>({
      query: (id) => ({ url: `/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: ["Task", "Subject"],
    }),
  }),
});
export const {
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
  useUpdateProfileMutation,
  useSubjectsQuery,
  useSubjectQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useTasksQuery,
  useTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useTaskStatusMutation,
  useDeleteTaskMutation,
} = api;

export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data as { detail?: unknown } | null;
    if (typeof data?.detail === "string") return data.detail;
  }
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 404
  )
    return "Запись не найдена.";
  return "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.";
}
