export function EmptyState({ title = "Información no disponible", text = "La fuente de datos no proporcionó información para esta sección." }: { title?: string; text?: string }) {
  return <div className="empty-state"><strong>{title}</strong><p>{text}</p></div>;
}
