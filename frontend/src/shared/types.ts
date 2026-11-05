export interface User {
  id: number; email: string; name: string; university: string; study_group: string; created_at: string;
}
export interface AuthResponse { access_token: string; token_type: string; user: User }
export interface Subject {
  id: number; title: string; teacher: string; color: string; description: string;
  created_at: string; task_count: number; completed_count: number;
}
export type SubjectInput = Pick<Subject, 'title' | 'teacher' | 'color' | 'description'>;
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task {
  id: number; title: string; description: string; subject_id: number; subject_title: string;
  subject_color: string; due_date: string; status: TaskStatus; priority: TaskPriority; created_at: string;
}
export type TaskInput = Pick<Task, 'title' | 'description' | 'subject_id' | 'due_date' | 'status' | 'priority'>;
export interface TaskFilters {
  search?: string; subject_id?: string; status?: string; priority?: string;
  due_before?: string; due_after?: string; pending?: string; sort?: string;
}
