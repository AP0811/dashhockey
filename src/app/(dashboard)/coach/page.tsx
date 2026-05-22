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
                    {participant.fullName}
                  </option>
                ))
              ) : (
                <option value="">Aucun athlète disponible</option>
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

        <div className="mt-6">
          <DocumentList
            documents={documents}
            emptyMessage="Aucun document pour l'athlète sélectionné."
          />
        </div>
      </section>
    </main>
  );
}
