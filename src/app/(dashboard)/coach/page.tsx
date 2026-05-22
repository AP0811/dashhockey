import RoleBadge from "@/components/ui/RoleBadge";
import DocumentList from "@/components/dashboard/DocumentList";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";

type CoachDashboardProps = {
  searchParams: Promise<{ participantId?: string }>;
};

export default async function CoachDashboardPage({ searchParams }: CoachDashboardProps) {
  const coach = await requireRole("coach");
  const params = await searchParams;

  const participants = await db.user.findMany({
    where: {
      role: "participant",
      groupName: coach.groupName ?? undefined,
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      participantCode: true,
      groupName: true,
    },
  });

  const selectedParticipant =
    participants.find((participant) => participant.id === params.participantId) ?? participants[0] ?? null;

  const documents = selectedParticipant
    ? await db.document.findMany({
        where: { participantId: selectedParticipant.id },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const teamDocumentCount = await db.document.count({
    where: {
      participant: {
        role: "participant",
        groupName: coach.groupName ?? undefined,
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <RoleBadge label="Coach" />
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Espace Coach</h1>
          </div>
          <LogoutButton />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Connecté en tant que {coach.fullName} ({coach.username}). Groupe: {coach.groupName ?? "N/A"}.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Athlètes du groupe</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{participants.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Documents du groupe</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{teamDocumentCount}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Athlète sélectionné</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{selectedParticipant?.fullName ?? "Aucun"}</p>
          </article>
        </div>

        <form className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4" method="GET">
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700" htmlFor="participantId">
            Choisir un athlète
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <select
              id="participantId"
              name="participantId"
              defaultValue={selectedParticipant?.id ?? ""}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {participants.length ? (
                participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.fullName} • {participant.participantCode ?? "Sans code"}
                  </option>
                ))
              ) : (
                <option value="">Aucun athlète dans ce groupe</option>
              )}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Voir ses documents
            </button>
          </div>
        </form>

        {selectedParticipant ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Profil athlète</p>
            <p className="mt-1 text-sm leading-6 text-emerald-950">
              {selectedParticipant.fullName} • Code {selectedParticipant.participantCode ?? "N/A"} • Groupe{" "}
              {selectedParticipant.groupName ?? "N/A"}
            </p>
          </div>
        ) : null}

        <div className="mt-6">
          <DocumentList
            documents={documents}
            emptyMessage="Aucun document pour l'athlète sélectionné ou aucun athlète dans ce groupe."
          />
        </div>
      </section>
    </main>
  );
}
