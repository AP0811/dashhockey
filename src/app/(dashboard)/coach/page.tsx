import RoleBadge from "@/components/ui/RoleBadge";
import DocumentList from "@/components/dashboard/DocumentList";
import LogoutButton from "@/components/dashboard/LogoutButton";
import CoachParticipantSelector from "@/components/dashboard/CoachParticipantSelector";
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
      _count: {
        select: {
          participantDocs: true,
        },
      },
    },
  });

  const selectedParticipant =
    participants.find((participant) => participant.id === params.participantId) ?? participants[0] ?? null;

  const documents = selectedParticipant
    ? await db.document.findMany({
        where: { participantId: selectedParticipant.id, audience: "participant" },
        select: {
          id: true,
          title: true,
          description: true,
          fileName: true,
          storageKey: true,
          audience: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const coachDocuments = await db.document.findMany({
    where: { audience: "coach" },
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      storageKey: true,
      audience: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
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

        <div className="mt-6">
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">Documents des coachs</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="mt-4">
              <DocumentList
                key={`coach-docs-${coachDocuments.length}`}
                documents={coachDocuments}
                emptyMessage="Aucun document réservé aux coachs pour le moment."
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">Documents des athlètes</h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700" htmlFor="participantId">
            Choisir un athlète
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <CoachParticipantSelector
              participants={participants.map((participant) => ({
                id: participant.id,
                fullName: participant.fullName,
                documentCount: participant._count.participantDocs,
              }))}
              selectedParticipantId={selectedParticipant?.id ?? ""}
            />
          </div>
        </div>

        <div className="mt-6">
          <DocumentList
            key={selectedParticipant?.id ?? "no-participant"}
            documents={documents}
            emptyMessage="Aucun document pour l'athlète sélectionné."
          />
        </div>
      </section>
    </main>
  );
}
