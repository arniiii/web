import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen, LoaderCircle, X } from 'lucide-react';
import { errorMessage } from './api';

export function Spinner({ label = 'Загружаем данные…' }: { label?: string }) {
  return <div className="loading" role="status"><LoaderCircle className="spin" size={24} /><span>{label}</span></div>;
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return <div className="error-state" role="alert"><AlertCircle size={22} /><p>{errorMessage(error)}</p>
    {retry && <button className="button secondary" onClick={retry}>Попробовать снова</button>}</div>;
}
export function FormError({ message }: { message: string }) {
  return message ? <p className="form-error" role="alert"><AlertCircle size={17} />{message}</p> : null;
}
export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><BookOpen size={26} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}
export function PageHeader({ eyebrow, title, subtitle, actions }: {
  eyebrow: string; title: string; subtitle?: string; actions?: ReactNode;
}) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>
    {actions && <div className="header-actions">{actions}</div>}</header>;
}
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="back-link" to={to}><ArrowLeft size={16} />{children}</Link>;
}
export function ConfirmDialog({ open, title, children, busy, error, onClose, onConfirm }: {
  open: boolean; title: string; children: ReactNode; busy: boolean; error: string;
  onClose: () => void; onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    else if (!open && ref.current?.open) ref.current?.close();
  }, [open]);
  return <dialog className="confirm-dialog" ref={ref} aria-labelledby="confirm-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="dialog-top"><h2 id="confirm-title">{title}</h2><button className="icon-button" aria-label="Закрыть" disabled={busy} onClick={onClose}><X size={19} /></button></div>
    <p>{children}</p><FormError message={error} />
    <div className="form-actions"><button className="button secondary" disabled={busy} onClick={onClose}>Отмена</button>
      <button className="button danger" disabled={busy} onClick={onConfirm}>{busy ? 'Удаляем…' : 'Удалить'}</button></div>
  </dialog>;
}
