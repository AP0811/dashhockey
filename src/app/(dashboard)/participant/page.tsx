import RoleBadge from "@/components/ui/RoleBadge";
import DocumentList from "@/components/dashboard/DocumentList";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";

export default async function ParticipantDashboardPage() {
  const participant = await requireRole("participant");

  const documents = await db.document.findMany({
    where: { participantId: participant.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <RoleBadge label="Participant" />
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Espace Participant</h1>
          </div>
          <LogoutButton />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Connecté en tant que {participant.fullName} ({participant.username}).
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-1">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Documents</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{documents.length}</p>
          </article>
        </div>

        <div className="mt-6">
          <DocumentList documents={documents} emptyMessage="Aucun document disponible pour ce participant." />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-600">Confidentialité: vous voyez uniquement vos propres documents.</p>
        </div>
      </section>
    </main>
  );
}
