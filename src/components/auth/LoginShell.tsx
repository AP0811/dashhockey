import LoginForm from "@/components/auth/LoginForm";

export default function LoginShell() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.26),_transparent_40%),linear-gradient(180deg,_#0f172a_0%,_#1e293b_42%,_#f8fafc_42%,_#f8fafc_100%)] px-6 py-10 text-slate-950 sm:px-8 lg:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/15 bg-slate-900 px-6 py-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:px-8">
          <h1 className="text-4xl font-black tracking-tight text-amber-300 sm:text-5xl">Maître chez nous</h1>
        </header>

        <section className="max-w-xl">
          <LoginForm />
        </section>
      </section>
    </main>
  );
}
