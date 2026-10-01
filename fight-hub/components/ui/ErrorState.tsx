"use client";
export function ErrorState({ message = "No pudimos cargar esta información." }: { message?: string }) {
  return <div className="empty-state"><strong>{message}</strong><button className="btn btn-secondary" onClick={() => location.reload()}>Reintentar</button></div>;
}
