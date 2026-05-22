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

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Code participant</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{participant.participantCode ?? "Non attribué"}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Groupe</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{participant.groupName ?? "Non attribué"}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Documents</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{documents.length}</p>
          </article>
        </div>

        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-semibold text-sky-900">Confidentialité</p>
          <p className="mt-1 text-sm leading-6 text-sky-950">
            Vous voyez uniquement vos propres documents. Le téléchargement sera activé via des liens signés lors de
            l&apos;intégration du stockage privé.
          </p>
        </div>

        <div className="mt-6">
          <DocumentList documents={documents} emptyMessage="Aucun document disponible pour ce participant." />
        </div>
      </section>
    </main>
  );
}
