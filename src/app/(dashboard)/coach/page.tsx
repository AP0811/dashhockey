import RoleBadge from "@/components/ui/RoleBadge";
import DocumentList from "@/components/dashboard/DocumentList";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";

export default async function CoachDashboardPage() {
  const coach = await requireRole("coach");
  const documents = await db.document.findMany({
    where: {
      audience: "participant",
      participant: {
        role: "participant",
        groupName: coach.groupName ?? undefined,
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      storageKey: true,
      audience: true,
      isVisibleToParticipant: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      participant: {
        select: {
          fullName: true,
        },
      },
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const coachDocuments = await db.document.findMany({
    where: { audience: "coach" },
    select: {
      id: true,
      title: true,
      description: true,
      fileName: true,
      storageKey: true,
      audience: true,
      isVisibleToParticipant: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      participant: {
        select: {
          fullName: true,
        },
      },
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

        <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">Documents des coachs</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </summary>
          <div className="mt-4">
            <DocumentList
              key={`coach-docs-${coachDocuments.length}`}
              documents={coachDocuments}
              emptyMessage="Aucun document réservé aux coachs pour le moment."
            />
          </div>
        </details>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">Documents des athlètes</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          </summary>

          <div className="mt-4">
            <DocumentList
              key={`athlete-docs-${documents.length}`}
              documents={documents}
              emptyMessage="Aucun document athlète disponible pour le moment."
            />
          </div>
        </details>
      </section>
    </main>
  );
}
