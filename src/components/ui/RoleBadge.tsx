type RoleBadgeProps = {
  label: string;
};

export default function RoleBadge({ label }: RoleBadgeProps) {
  return (
    <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
      {label}
    </span>
  );
}
