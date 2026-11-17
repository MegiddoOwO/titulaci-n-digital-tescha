// Temporary body of the admin sections that are ported in T7c-2.
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6 space-y-2">
      <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground font-body text-sm">Esta sección estará disponible próximamente.</p>
    </div>
  );
}
