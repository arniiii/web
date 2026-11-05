// Calendar dates are local dates, never parsed as UTC midnight.
export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}
export function shortDate(value: string): string {
  return parseDate(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}
export function fullDate(value: string): string {
  return parseDate(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
export function dayOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateKey(date);
}
export const statusLabels = {
  todo: "К выполнению",
  in_progress: "В работе",
  done: "Выполнено",
};
export const priorityLabels = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};
