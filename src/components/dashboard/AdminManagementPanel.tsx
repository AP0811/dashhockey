"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ParticipantOption = {
  id: string;
  fullName: string;
  username: string;
};

type DocumentOption = {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  participantId: string;
  participantFullName: string;
};

type Props = {
  participants: ParticipantOption[];
  documents: DocumentOption[];
  recentParticipants: Array<ParticipantOption & { documentCount: number }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    updatedAt: Date;
    participantFullName: string;
  }>;
};

export default function AdminManagementPanel({ participants, documents, recentParticipants, recentDocuments }: Props) {
  const router = useRouter();
  const hasParticipants = participants.length > 0;

  const [participantForm, setParticipantForm] = useState({
    fullName: "",
    username: "",
    password: "",
  });

  const [uploadForm, setUploadForm] = useState({
    participantId: participants[0]?.id ?? "",
    title: "",
    description: "",
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [participantMessage, setParticipantMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingParticipantForm, setEditingParticipantForm] = useState({
    fullName: "",
    username: "",
    password: "",
  });
  const [editingParticipantMessage, setEditingParticipantMessage] = useState("");

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentForm, setEditingDocumentForm] = useState({
    participantId: participants[0]?.id ?? "",
    title: "",
    description: "",
  });
  const [editingDocumentFile, setEditingDocumentFile] = useState<File | null>(null);
  const [editingDocumentMessage, setEditingDocumentMessage] = useState("");

  const startEditingParticipant = (participantId: string) => {
    const selectedParticipant = participants.find((participant) => participant.id === participantId);

    if (!selectedParticipant) {
      return;
    }

    setEditingParticipantId(participantId);
    setEditingParticipantForm({
      fullName: selectedParticipant.fullName,
      username: selectedParticipant.username,
      password: "",
    });
    setEditingParticipantMessage("");
  };

  const deleteParticipant = async (participantId: string) => {
    if (!window.confirm("Supprimer ce participant et tous ses documents ?")) {
      return;
    }

    const response = await fetch(`/api/admin/participants/${participantId}`, {
      method: "DELETE",
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      window.alert(payload.error ?? "Erreur de suppression participant.");
      return;
    }

    router.refresh();
  };

  const saveEditedParticipant = async () => {
    if (!editingParticipantId) {
      return;
    }

    setEditingParticipantMessage("");

    const response = await fetch(`/api/admin/participants/${editingParticipantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingParticipantForm),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setEditingParticipantMessage(payload.error ?? "Erreur de modification participant.");
      return;
    }

    setEditingParticipantMessage("Participant modifié avec succès.");
    setEditingParticipantId(null);
    router.refresh();
  };

  const startEditingDocument = (documentId: string) => {
    const selectedDocument = documents.find((document) => document.id === documentId);

    if (!selectedDocument) {
      return;
    }

    setEditingDocumentId(documentId);
    setEditingDocumentForm({
      participantId: selectedDocument.participantId,
      title: selectedDocument.title,
      description: selectedDocument.description ?? "",
    });
    setEditingDocumentFile(null);
    setEditingDocumentMessage("");
  };

  const saveEditedDocument = async () => {
    if (!editingDocumentId) {
      return;
    }

    setEditingDocumentMessage("");

    const data = new FormData();
    data.set("participantId", editingDocumentForm.participantId);
    data.set("title", editingDocumentForm.title);
    data.set("description", editingDocumentForm.description);
    if (editingDocumentFile) {
      data.set("file", editingDocumentFile);
    }

    const response = await fetch(`/api/admin/documents/${editingDocumentId}`, {
      method: "PATCH",
      body: data,
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setEditingDocumentMessage(payload.error ?? "Erreur de modification document.");
      return;
    }

    setEditingDocumentMessage("Document modifié avec succès.");
    setEditingDocumentId(null);
    setEditingDocumentFile(null);
    router.refresh();
  };

  const deleteDocument = async (documentId: string) => {
    if (!window.confirm("Supprimer ce document ?")) {
      return;
    }

    const response = await fetch(`/api/admin/documents/${documentId}`, {
      method: "DELETE",
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      window.alert(payload.error ?? "Erreur de suppression document.");
      return;
    }

    router.refresh();
  };

  const createParticipant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setParticipantMessage("");

    const response = await fetch("/api/admin/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(participantForm),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setParticipantMessage(payload.error ?? "Erreur de création participant.");
      return;
    }

    setParticipantMessage("Participant créé avec succès.");
    setParticipantForm({
      fullName: "",
      username: "",
      password: "",
    });
    router.refresh();
  };

  const uploadDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadMessage("");

    if (!uploadFile) {
      setUploadMessage("Choisissez un fichier PDF.");
      return;
    }

    if (!hasParticipants || !uploadForm.participantId) {
      setUploadMessage("Créez d'abord un participant.");
      return;
    }

    const data = new FormData();
    data.set("participantId", uploadForm.participantId);
    data.set("title", uploadForm.title);
    data.set("description", uploadForm.description);
    data.set("file", uploadFile);

    const response = await fetch("/api/admin/documents", {
      method: "POST",
      body: data,
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setUploadMessage(payload.error ?? "Erreur d'upload document.");
      return;
    }

    setUploadMessage("Document uploadé avec succès.");
    setUploadForm((current) => ({ ...current, title: "", description: "" }));
    setUploadFile(null);
    router.refresh();
  };

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <form onSubmit={createParticipant} className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Créer un participant</h2>
        <div className="mt-3 grid gap-3">
          <input
            required
            placeholder="Nom complet"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={participantForm.fullName}
            onChange={(event) => setParticipantForm((current) => ({ ...current, fullName: event.target.value }))}
          />
          <input
            required
            placeholder="Username"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={participantForm.username}
            onChange={(event) => setParticipantForm((current) => ({ ...current, username: event.target.value }))}
          />
          <input
            required
            type="password"
            placeholder="Mot de passe"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={participantForm.password}
            onChange={(event) => setParticipantForm((current) => ({ ...current, password: event.target.value }))}
          />
        </div>
        <button
          type="submit"
          className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Créer le participant
        </button>
        {participantMessage ? <p className="mt-3 text-sm text-slate-700">{participantMessage}</p> : null}
      </form>

      <form onSubmit={uploadDocument} className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Uploader un document PDF</h2>
        <div className="mt-3 grid gap-3">
          <select
            required
            disabled={!hasParticipants}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={uploadForm.participantId}
            onChange={(event) => setUploadForm((current) => ({ ...current, participantId: event.target.value }))}
          >
            {hasParticipants ? (
              participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.fullName}
                </option>
              ))
            ) : (
              <option value="">Aucun participant disponible</option>
            )}
          </select>
          <input
            required
            placeholder="Titre du document"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={uploadForm.title}
            onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))}
          />
          <textarea
            placeholder="Description"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={uploadForm.description}
            onChange={(event) => setUploadForm((current) => ({ ...current, description: event.target.value }))}
          />
          <input
            required
            type="file"
            accept="application/pdf"
            disabled={!hasParticipants}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={!hasParticipants}
          className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Uploader le PDF
        </button>
        {uploadMessage ? <p className="mt-3 text-sm text-slate-700">{uploadMessage}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Participants récents</h2>
        {recentParticipants.length ? (
          <ul className="mt-3 space-y-2">
            {recentParticipants.map((participant) => (
              <li
                key={participant.id}
                className="flex flex-col gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-900">{participant.fullName}</span> • {participant.username}
                  <br />
                  {participant.documentCount} document(s)
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditingParticipant(participant.id)}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteParticipant(participant.id)}
                    className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Supprimer
                  </button>
                </div>
                {editingParticipantId === participant.id ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={editingParticipantForm.fullName}
                        onChange={(event) =>
                          setEditingParticipantForm((current) => ({ ...current, fullName: event.target.value }))
                        }
                        placeholder="Nom complet"
                      />
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={editingParticipantForm.username}
                        onChange={(event) =>
                          setEditingParticipantForm((current) => ({ ...current, username: event.target.value }))
                        }
                        placeholder="Username"
                      />
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={editingParticipantForm.password}
                        onChange={(event) =>
                          setEditingParticipantForm((current) => ({ ...current, password: event.target.value }))
                        }
                        placeholder="Nouveau mot de passe"
                        type="password"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={saveEditedParticipant}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingParticipantId(null)}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Annuler
                      </button>
                      {editingParticipantMessage ? (
                        <span className="self-center text-xs text-slate-600">{editingParticipantMessage}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Aucun participant trouvé.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Documents récents</h2>
        {recentDocuments.length ? (
          <ul className="mt-3 space-y-2">
            {recentDocuments.map((document) => (
              <li
                key={document.id}
                className="flex flex-col gap-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-900">{document.title}</span>
                  <br />
                  {document.participantFullName} • {document.updatedAt.toISOString().slice(0, 10)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditingDocument(document.id)}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDocument(document.id)}
                    className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Supprimer
                  </button>
                </div>
                {editingDocumentId === document.id ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                    <div className="grid gap-3 md:grid-cols-2">
                      <select
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={editingDocumentForm.participantId}
                        onChange={(event) =>
                          setEditingDocumentForm((current) => ({ ...current, participantId: event.target.value }))
                        }
                      >
                        {participants.map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.fullName}
                          </option>
                        ))}
                      </select>
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={editingDocumentForm.title}
                        onChange={(event) =>
                          setEditingDocumentForm((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="Titre du document"
                      />
                      <textarea
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                        value={editingDocumentForm.description}
                        onChange={(event) =>
                          setEditingDocumentForm((current) => ({ ...current, description: event.target.value }))
                        }
                        placeholder="Description"
                      />
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                        type="file"
                        accept="application/pdf"
                        onChange={(event) => setEditingDocumentFile(event.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={saveEditedDocument}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDocumentId(null)}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Annuler
                      </button>
                      {editingDocumentMessage ? (
                        <span className="self-center text-xs text-slate-600">{editingDocumentMessage}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Aucun document trouvé.</p>
        )}
      </section>
    </div>
  );
}
