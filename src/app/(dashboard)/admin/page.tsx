import RoleBadge from "@/components/ui/RoleBadge";
import LogoutButton from "@/components/dashboard/LogoutButton";
import AdminManagementPanel from "@/components/dashboard/AdminManagementPanel";
import { requireRole } from "@/lib/auth-server";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const admin = await requireRole("admin");
  const [participantCount, documentCount, allParticipants, allDocuments, participantsWithCounts, recentDocuments] = await Promise.all([
    db.user.count({ where: { role: "participant" } }),
    db.document.count(),
    db.user.findMany({
      where: { role: "participant" },
      select: {
        id: true,
        fullName: true,
        username: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.document.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        participantId: true,
        updatedAt: true,
        audience: true,
        participant: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.user.findMany({
      where: { role: "participant" },
      select: {
        id: true,
        fullName: true,
        username: true,
        _count: { select: { participantDocs: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.document.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        participantId: true,
        updatedAt: true,
        audience: true,
        participant: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.1)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <RoleBadge label="Administration" />
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Espace Administration</h1>
          </div>
          <LogoutButton />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Connecté en tant que {admin.fullName}. Les indicateurs proviennent de la base PostgreSQL.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Participants</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{participantCount}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Documents</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{documentCount}</p>
          </article>
        </div>

        <AdminManagementPanel
          participants={allParticipants.map((participant) => ({
            id: participant.id,
            fullName: participant.fullName,
            username: participant.username,
          }))}
          documents={allDocuments.map((document) => ({
            id: document.id,
            title: document.title,
            description: document.description,
            fileName: document.fileName,
            participantId: document.participantId,
            audience: document.audience,
            participantFullName: document.participant?.fullName ?? "Document coach",
          }))}
          recentParticipants={participantsWithCounts.map((participant) => ({
            id: participant.id,
            fullName: participant.fullName,
            username: participant.username,
            documentCount: participant._count.participantDocs,
          }))}
          recentDocuments={recentDocuments.map((document) => ({
            id: document.id,
            title: document.title,
            updatedAt: document.updatedAt,
            audience: document.audience,
            participantFullName: document.participant?.fullName ?? "Document coach",
          }))}
        />
      </section>
    </main>
  );
}
