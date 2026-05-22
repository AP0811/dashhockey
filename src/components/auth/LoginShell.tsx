import RoleBadge from "@/components/ui/RoleBadge";
import LoginForm from "@/components/auth/LoginForm";

const roleItems = [
  { href: "/participant", title: "Espace Participant", text: "Consulter ses documents personnels." },
  { href: "/coach", title: "Espace Coach", text: "Selectionner un athlète et voir ses PDFs." },
  { href: "/admin", title: "Espace Administration", text: "Gerer les accès et le cycle documentaire." },
];

export default function LoginShell() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.26),_transparent_40%),linear-gradient(180deg,_#0f172a_0%,_#1e293b_42%,_#f8fafc_42%,_#f8fafc_100%)] px-6 py-10 text-slate-950 sm:px-8 lg:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/15 bg-slate-900 px-6 py-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">App Hockey Gars</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Portail de Production</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Cette base est volontairement propre et sans données test. L&apos;authentification, la base de données et le stockage
            PDF seront connectés par configuration.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {roleItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,23,42,0.13)]"
            >
              <RoleBadge label={item.title.replace("Espace ", "")} />
              <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </a>
          ))}
        </section>

        <section className="max-w-xl">
          <LoginForm />
        </section>
      </section>
    </main>
  );
}
