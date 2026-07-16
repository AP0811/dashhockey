"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ParticipantOption = {
  id: string;
  fullName: string;
  username: string;
};

type CategoryOption = {
  id: string;
  name: string;
  documentCount: number;
};

type DocumentOption = {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  participantId: string | null;
  audience: "participant" | "coach";
  categoryId: string | null;
  categoryName: string | null;
  isVisibleToParticipant: boolean;
  participantFullName: string;
};

type Props = {
  categories: CategoryOption[];
  participants: ParticipantOption[];
  documents: DocumentOption[];
  recentParticipants: Array<ParticipantOption & { documentCount: number }>;
};

type QuickDocState = {
  categoryId: string;
  isVisibleToParticipant: boolean;
};

export default function AdminManagementPanel({ categories, participants, documents, recentParticipants }: Props) {
  const router = useRouter();
  const hasParticipants = participants.length > 0;

  const [section, setSection] = useState<"documents" | "participants" | "categories">("documents");

  const [participantForm, setParticipantForm] = useState({ fullName: "", username: "", password: "" });
  const [participantMessage, setParticipantMessage] = useState("");
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingParticipantForm, setEditingParticipantForm] = useState({ fullName: "", username: "", password: "" });
  const [editingParticipantMessage, setEditingParticipantMessage] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryMessage, setCategoryMessage] = useState("");
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});

  const [uploadParticipantQuery, setUploadParticipantQuery] = useState("");
  const [uploadForm, setUploadForm] = useState({
    participantId: participants[0]?.id ?? "",
    title: "",
    description: "",
    categoryId: "",
    coachOnly: false,
    isVisibleToParticipant: true,
  });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadMultiplePerAthlete, setUploadMultiplePerAthlete] = useState(false);
  const [uploadFilesByParticipantId, setUploadFilesByParticipantId] = useState<Record<string, File | null>>({});

  const [quickDocumentState, setQuickDocumentState] = useState<Record<string, QuickDocState>>({});
  const [documentActionMessage, setDocumentActionMessage] = useState<Record<string, string>>({});
  const [bulkAthleteSaveMessage, setBulkAthleteSaveMessage] = useState("");
  const [isBulkAthleteSaving, setIsBulkAthleteSaving] = useState(false);
  const [documentSearch, setDocumentSearch] = useState("");
  const [documentCategoryFilter, setDocumentCategoryFilter] = useState("all");
  const [documentSortBy, setDocumentSortBy] = useState<"name" | "category" | "athlete">("name");
  const [isAthleteDocsOpen, setIsAthleteDocsOpen] = useState(false);
  const [isCoachDocsOpen, setIsCoachDocsOpen] = useState(false);

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentForm, setEditingDocumentForm] = useState({
    participantId: participants[0]?.id ?? "",
    title: "",
    description: "",
    categoryId: "",
    coachOnly: false,
    isVisibleToParticipant: true,
  });
  const [editingDocumentFile, setEditingDocumentFile] = useState<File | null>(null);
  const [editingDocumentMessage, setEditingDocumentMessage] = useState("");

  const categoryOptions = useMemo(
    () => [...categories].sort((left, right) => left.name.localeCompare(right.name)),
    [categories],
  );

  const filteredUploadParticipants = useMemo(() => {
    const query = uploadParticipantQuery.trim().toLowerCase();

    if (!query) {
      return participants;
    }

    return participants.filter((participant) => {
      const haystack = `${participant.fullName} ${participant.username}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [participants, uploadParticipantQuery]);

  const uploadParticipantOptions = useMemo(() => {
    if (uploadForm.coachOnly) {
      return [];
    }

    const selected = participants.find((participant) => participant.id === uploadForm.participantId);

    if (!selected) {
      return filteredUploadParticipants;
    }

    if (filteredUploadParticipants.some((participant) => participant.id === selected.id)) {
      return filteredUploadParticipants;
    }

    return [selected, ...filteredUploadParticipants];
  }, [filteredUploadParticipants, participants, uploadForm.coachOnly, uploadForm.participantId]);

  const coachDocuments = useMemo(
    () => documents.filter((document) => document.audience === "coach"),
    [documents],
  );

  const athleteDocuments = useMemo(
    () => documents.filter((document) => document.audience === "participant"),
    [documents],
  );

  const filteredAthleteDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();

    const filtered = athleteDocuments.filter((document) => {
      const matchesCategory =
        documentCategoryFilter === "all" ? true : (document.categoryId ?? "") === documentCategoryFilter;

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = `${document.title} ${document.participantFullName}`.toLowerCase();
      return haystack.includes(query);
    });

    return [...filtered].sort((left, right) => {
      if (documentSortBy === "category") {
        const leftCategory = left.categoryName ?? "Sans catégorie";
        const rightCategory = right.categoryName ?? "Sans catégorie";
        const byCategory = leftCategory.localeCompare(rightCategory, "fr", { sensitivity: "base" });

        if (byCategory !== 0) {
          return byCategory;
        }
      }

      if (documentSortBy === "athlete") {
        const byAthlete = left.participantFullName.localeCompare(right.participantFullName, "fr", {
          sensitivity: "base",
        });

        if (byAthlete !== 0) {
          return byAthlete;
        }
      }

      return left.title.localeCompare(right.title, "fr", { sensitivity: "base" });
    });
  }, [athleteDocuments, documentCategoryFilter, documentSearch, documentSortBy]);

  const filteredCoachDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();

    const filtered = coachDocuments.filter((document) => {
      const matchesCategory =
        documentCategoryFilter === "all" ? true : (document.categoryId ?? "") === documentCategoryFilter;

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      return document.title.toLowerCase().includes(query);
    });

    return [...filtered].sort((left, right) => {
      if (documentSortBy === "category") {
        const leftCategory = left.categoryName ?? "Sans catégorie";
        const rightCategory = right.categoryName ?? "Sans catégorie";
        const byCategory = leftCategory.localeCompare(rightCategory, "fr", { sensitivity: "base" });

        if (byCategory !== 0) {
          return byCategory;
        }
      }

      return left.title.localeCompare(right.title, "fr", { sensitivity: "base" });
    });
  }, [coachDocuments, documentCategoryFilter, documentSearch, documentSortBy]);

  const resolveQuickState = (document: DocumentOption): QuickDocState => {
    return quickDocumentState[document.id] ?? {
      categoryId: document.categoryId ?? "",
      isVisibleToParticipant: document.isVisibleToParticipant,
    };
  };

  const updateQuickState = (documentId: string, partial: Partial<QuickDocState>) => {
    setQuickDocumentState((current) => {
      const previous = current[documentId] ?? { categoryId: "", isVisibleToParticipant: true };
      return {
        ...current,
        [documentId]: { ...previous, ...partial },
      };
    });
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

    setParticipantForm({ fullName: "", username: "", password: "" });
    setParticipantMessage("Participant créé avec succès.");
    router.refresh();
  };

  const startEditingParticipant = (participantId: string) => {
    const selected = participants.find((participant) => participant.id === participantId);

    if (!selected) {
      return;
    }

    setEditingParticipantId(participantId);
    setEditingParticipantForm({ fullName: selected.fullName, username: selected.username, password: "" });
    setEditingParticipantMessage("");
  };

  const saveEditedParticipant = async () => {
    if (!editingParticipantId) {
      return;
    }

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

    setEditingParticipantId(null);
    setEditingParticipantMessage("Participant modifié avec succès.");
    router.refresh();
  };

  const deleteParticipant = async (participantId: string) => {
    if (!window.confirm("Supprimer ce participant et ses documents ?")) {
      return;
    }

    const response = await fetch(`/api/admin/participants/${participantId}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      window.alert(payload.error ?? "Erreur de suppression participant.");
      return;
    }

    router.refresh();
  };

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategoryMessage("");

    const response = await fetch("/api/admin/documents?resource=categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryName }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setCategoryMessage(payload.error ?? "Erreur de création catégorie.");
      return;
    }

    setCategoryName("");
    setCategoryMessage("Catégorie créée avec succès.");
    router.refresh();
  };

  const saveCategoryRename = async (categoryId: string, fallbackName: string) => {
    setCategoryMessage("");
    const name = (categoryDrafts[categoryId] ?? fallbackName).trim();

    const response = await fetch("/api/admin/documents?resource=categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setCategoryMessage(payload.error ?? "Erreur de renommage catégorie.");
      return;
    }

    setCategoryMessage("Catégorie mise à jour.");
    router.refresh();
  };

  const deleteCategory = async (categoryId: string) => {
    if (!window.confirm("Supprimer cette catégorie ?")) {
      return;
    }

    const response = await fetch(`/api/admin/documents?resource=categories&categoryId=${encodeURIComponent(categoryId)}`, {
      method: "DELETE",
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setCategoryMessage(payload.error ?? "Erreur de suppression catégorie.");
      return;
    }

    setCategoryMessage("Catégorie supprimée.");
    router.refresh();
  };

  const uploadDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadMessage("");

    if (!uploadForm.coachOnly && uploadMultiplePerAthlete && !filteredUploadParticipants.length) {
      setUploadMessage("Aucun athlète trouvé pour l'import en lot.");
      return;
    }

    if (!uploadForm.coachOnly && !uploadMultiplePerAthlete && (!hasParticipants || !uploadForm.participantId)) {
      setUploadMessage("Choisissez un athlète.");
      return;
    }

    if (!uploadMultiplePerAthlete && !uploadFiles.length) {
      setUploadMessage("Choisissez un PDF.");
      return;
    }

    const participantFileEntries = uploadMultiplePerAthlete
      ? filteredUploadParticipants
          .map((participant) => ({
            participantId: participant.id,
            file: uploadFilesByParticipantId[participant.id] ?? null,
          }))
          .filter((entry): entry is { participantId: string; file: File } => entry.file instanceof File)
      : [];

    if (uploadMultiplePerAthlete && !participantFileEntries.length) {
      setUploadMessage("Ajoutez au moins un fichier dans la liste des athlètes.");
      return;
    }

    const data = new FormData();
    data.set("participantId", uploadForm.participantId);
    data.set("title", uploadForm.title);
    data.set("description", uploadForm.description);
    data.set("audience", uploadForm.coachOnly ? "coach" : "participant");
    data.set("categoryId", uploadForm.categoryId);
    data.set("isVisibleToParticipant", uploadForm.isVisibleToParticipant ? "true" : "false");

    if (!uploadForm.coachOnly && uploadMultiplePerAthlete) {
      data.set(
        "participantIds",
        JSON.stringify(participantFileEntries.map((entry) => entry.participantId)),
      );
      data.set("assignMode", "oneToOne");
      for (const entry of participantFileEntries) {
        data.append("files", entry.file);
      }
    } else {
      data.set("file", uploadFiles[0]);
    }

    if (uploadForm.coachOnly) {
      data.delete("participantId");
      data.set("isVisibleToParticipant", "false");
    }

    if (!uploadForm.categoryId) {
      data.delete("categoryId");
    }

    const response = await fetch("/api/admin/documents", {
      method: "POST",
      body: data,
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setUploadMessage(payload.error ?? "Erreur d'upload document.");
      return;
    }

    setUploadForm((current) => ({
      ...current,
      title: "",
      description: "",
      categoryId: "",
      isVisibleToParticipant: true,
    }));
    setUploadFiles([]);
    setUploadFilesByParticipantId({});
    if (!uploadForm.coachOnly && uploadMultiplePerAthlete) {
      const successPayload = (payload ?? {}) as { createdCount?: number };
      setUploadMessage(
        `${successPayload.createdCount ?? participantFileEntries.length} document(s) importé(s) pour les athlètes ciblés.`,
      );
    } else {
      const successPayload = (payload ?? {}) as { createdCount?: number };
      setUploadMessage(`${successPayload.createdCount ?? 1} document(s) uploadé(s) avec succès.`);
    }
    router.refresh();
  };

  const saveQuickDocument = async (document: DocumentOption) => {
    const state = resolveQuickState(document);

    const data = new FormData();
    data.set("participantId", document.participantId ?? "");
    data.set("title", document.title);
    data.set("description", document.description ?? "");
    data.set("audience", document.audience);
    data.set("categoryId", state.categoryId);
    data.set("isVisibleToParticipant", state.isVisibleToParticipant ? "true" : "false");

    if (document.audience === "coach") {
      data.delete("participantId");
      data.set("isVisibleToParticipant", "false");
    }

    if (!state.categoryId) {
      data.delete("categoryId");
    }

    const response = await fetch(`/api/admin/documents/${document.id}`, {
      method: "PATCH",
      body: data,
    });

    const payload = (await response.json()) as { error?: string };

    setDocumentActionMessage((current) => ({
      ...current,
      [document.id]: response.ok ? "Modifications enregistrées." : payload.error ?? "Erreur de mise à jour document.",
    }));

    if (response.ok) {
      router.refresh();
    }
  };

  const saveAllAthleteQuickDocuments = async () => {
    setBulkAthleteSaveMessage("");

    const documentsToSave = athleteDocuments.filter((document) => {
      const state = resolveQuickState(document);
      return state.categoryId !== (document.categoryId ?? "") || state.isVisibleToParticipant !== document.isVisibleToParticipant;
    });

    if (!documentsToSave.length) {
      setBulkAthleteSaveMessage("Aucune modification à enregistrer.");
      return;
    }

    setIsBulkAthleteSaving(true);

    const results = await Promise.all(
      documentsToSave.map(async (document) => {
        const state = resolveQuickState(document);
        const data = new FormData();
        data.set("participantId", document.participantId ?? "");
        data.set("title", document.title);
        data.set("description", document.description ?? "");
        data.set("audience", document.audience);
        data.set("categoryId", state.categoryId);
        data.set("isVisibleToParticipant", state.isVisibleToParticipant ? "true" : "false");

        if (!state.categoryId) {
          data.delete("categoryId");
        }

        const response = await fetch(`/api/admin/documents/${document.id}`, {
          method: "PATCH",
          body: data,
        });

        const payload = (await response.json()) as { error?: string };

        return {
          documentId: document.id,
          ok: response.ok,
          error: payload.error ?? "Erreur de mise à jour document.",
        };
      }),
    );

    setDocumentActionMessage((current) => {
      const next = { ...current };
      for (const result of results) {
        next[result.documentId] = result.ok ? "Modifications enregistrées." : result.error;
      }
      return next;
    });

    const successCount = results.filter((result) => result.ok).length;
    const failureCount = results.length - successCount;

    if (!failureCount) {
      setBulkAthleteSaveMessage(`${successCount} document(s) enregistré(s).`);
      router.refresh();
    } else {
      setBulkAthleteSaveMessage(
        `${successCount} document(s) enregistré(s), ${failureCount} en erreur. Consulte les messages de ligne.`,
      );
    }

    setIsBulkAthleteSaving(false);
  };

  const startEditingDocument = (document: DocumentOption) => {
    setEditingDocumentId(document.id);
    setEditingDocumentForm({
      participantId: document.participantId ?? participants[0]?.id ?? "",
      title: document.title,
      description: document.description ?? "",
      categoryId: document.categoryId ?? "",
      coachOnly: document.audience === "coach",
      isVisibleToParticipant: document.isVisibleToParticipant,
    });
    setEditingDocumentFile(null);
    setEditingDocumentMessage("");
  };

  const saveEditedDocument = async () => {
    if (!editingDocumentId) {
      return;
    }

    const data = new FormData();
    data.set("participantId", editingDocumentForm.participantId);
    data.set("title", editingDocumentForm.title);
    data.set("description", editingDocumentForm.description);
    data.set("audience", editingDocumentForm.coachOnly ? "coach" : "participant");
    data.set("categoryId", editingDocumentForm.categoryId);
    data.set("isVisibleToParticipant", editingDocumentForm.isVisibleToParticipant ? "true" : "false");

    if (editingDocumentForm.coachOnly) {
      data.delete("participantId");
      data.set("isVisibleToParticipant", "false");
    }

    if (!editingDocumentForm.categoryId) {
      data.delete("categoryId");
    }

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

    const response = await fetch(`/api/admin/documents/${documentId}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      window.alert(payload.error ?? "Erreur de suppression document.");
      return;
    }

    router.refresh();
  };

  return (
    <div className="mt-6 space-y-6">
      <nav className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSection("documents")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              section === "documents" ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            Documents
          </button>
          <button
            type="button"
            onClick={() => setSection("participants")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              section === "participants" ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            Participants
          </button>
          <button
            type="button"
            onClick={() => setSection("categories")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              section === "categories" ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            Catégories
          </button>
        </div>
      </nav>

      {section === "documents" ? (
        <div className="grid gap-6">
          <form onSubmit={uploadDocument} className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Uploader un document PDF</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={uploadForm.coachOnly}
                  onChange={(event) => {
                    setUploadMultiplePerAthlete(false);
                    setUploadFilesByParticipantId({});
                    setUploadForm((current) => ({
                      ...current,
                      coachOnly: event.target.checked,
                      participantId: event.target.checked ? "" : current.participantId || (participants[0]?.id ?? ""),
                      isVisibleToParticipant: event.target.checked ? false : current.isVisibleToParticipant,
                    }));
                  }}
                />
                Réserver ce document aux coachs
              </label>

              {!uploadForm.coachOnly ? (
                <label className="flex items-center gap-3 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={uploadMultiplePerAthlete}
                    onChange={(event) => {
                      setUploadMultiplePerAthlete(event.target.checked);
                      setUploadFiles([]);
                      setUploadFilesByParticipantId({});
                    }}
                  />
                  Import multiple: 1 document par athlète ({filteredUploadParticipants.length})
                </label>
              ) : null}

              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={uploadForm.categoryId}
                onChange={(event) => setUploadForm((current) => ({ ...current, categoryId: event.target.value }))}
              >
                <option value="">Sans catégorie</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-3 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={uploadForm.isVisibleToParticipant}
                  disabled={uploadForm.coachOnly}
                  onChange={(event) =>
                    setUploadForm((current) => ({ ...current, isVisibleToParticipant: event.target.checked }))
                  }
                />
                Visible dans l'espace athlète
              </label>

              <input
                type="search"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                disabled={!hasParticipants || uploadForm.coachOnly}
                placeholder={uploadForm.coachOnly ? "Aucun participant requis" : "Rechercher un participant"}
                value={uploadParticipantQuery}
                onChange={(event) => setUploadParticipantQuery(event.target.value)}
              />

              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                value={uploadForm.participantId}
                disabled={!hasParticipants || uploadForm.coachOnly || uploadMultiplePerAthlete || !uploadParticipantOptions.length}
                onChange={(event) => setUploadForm((current) => ({ ...current, participantId: event.target.value }))}
              >
                {uploadForm.coachOnly ? (
                  <option value="">Aucun participant requis</option>
                ) : (
                  uploadParticipantOptions.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.fullName} ({participant.username})
                    </option>
                  ))
                )}
              </select>

              <input
                required
                placeholder="Titre"
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
              {uploadMultiplePerAthlete ? (
                <div className="rounded-xl border border-slate-300 p-3 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Liste des participants</p>
                  <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {filteredUploadParticipants.map((participant) => (
                      <label key={participant.id} className="grid gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center">
                        <span className="text-sm text-slate-700">{participant.fullName}</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          onChange={(event) =>
                            setUploadFilesByParticipantId((current) => ({
                              ...current,
                              [participant.id]: event.target.files?.[0] ?? null,
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <input
                  required
                  type="file"
                  accept="application/pdf"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                  onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
                />
              )}
            </div>
            <button type="submit" className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Uploader
            </button>
            {uploadMessage ? <p className="mt-3 text-sm text-slate-700">{uploadMessage}</p> : null}
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Recherche et filtres</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                type="search"
                placeholder="Rechercher un document ou un athlète"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={documentSearch}
                onChange={(event) => setDocumentSearch(event.target.value)}
              />
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={documentCategoryFilter}
                onChange={(event) => setDocumentCategoryFilter(event.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                value={documentSortBy}
                onChange={(event) => setDocumentSortBy(event.target.value as "name" | "category" | "athlete")}
              >
                <option value="name">Trier par nom du document</option>
                <option value="category">Trier par catégorie</option>
                <option value="athlete">Trier par athlète</option>
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Documents des athlètes</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveAllAthleteQuickDocuments}
                  disabled={isBulkAthleteSaving}
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBulkAthleteSaving ? "Enregistrement..." : "Enregistrer tout"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAthleteDocsOpen((current) => !current)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                  aria-label={isAthleteDocsOpen ? "Replier" : "Déplier"}
                >
                  {isAthleteDocsOpen ? "▼" : "▶"}
                </button>
              </div>
            </div>
            {bulkAthleteSaveMessage ? <p className="mt-2 text-xs text-slate-600">{bulkAthleteSaveMessage}</p> : null}
            {isAthleteDocsOpen && filteredAthleteDocuments.length ? (
              <ul className="mt-3 space-y-2">
                {filteredAthleteDocuments.map((document) => {
                  const state = resolveQuickState(document);

                  return (
                    <li key={document.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{document.title}</p>
                          <p className="text-xs text-slate-500">{document.participantFullName}</p>
                        </div>

                        <div className="flex w-fit flex-col items-end gap-2">
                          <select
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                            value={state.categoryId}
                            onChange={(event) => updateQuickState(document.id, { categoryId: event.target.value })}
                          >
                            <option value="">Sans catégorie</option>
                            {categoryOptions.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-1 text-xs">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5"
                              checked={state.isVisibleToParticipant}
                              onChange={(event) =>
                                updateQuickState(document.id, { isVisibleToParticipant: event.target.checked })
                              }
                            />
                            Visible pour l'athlète
                          </label>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveQuickDocument(document)}
                          className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingDocument(document)}
                          className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          Modifier détails
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDocument(document.id)}
                          className="rounded-full border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700"
                        >
                          Supprimer
                        </button>
                        {documentActionMessage[document.id] ? (
                          <span className="self-center text-xs text-slate-600">{documentActionMessage[document.id]}</span>
                        ) : null}
                      </div>

                      {editingDocumentId === document.id ? (
                        <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={editingDocumentForm.coachOnly}
                              onChange={(event) =>
                                setEditingDocumentForm((current) => ({
                                  ...current,
                                  coachOnly: event.target.checked,
                                  participantId: event.target.checked
                                    ? ""
                                    : current.participantId || (participants[0]?.id ?? ""),
                                  isVisibleToParticipant: event.target.checked ? false : current.isVisibleToParticipant,
                                }))
                              }
                            />
                            Réserver aux coachs
                          </label>
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={editingDocumentForm.title}
                            onChange={(event) =>
                              setEditingDocumentForm((current) => ({ ...current, title: event.target.value }))
                            }
                            placeholder="Titre"
                          />
                          <textarea
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={editingDocumentForm.description}
                            onChange={(event) =>
                              setEditingDocumentForm((current) => ({ ...current, description: event.target.value }))
                            }
                            placeholder="Description"
                          />
                          <select
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={editingDocumentForm.categoryId}
                            onChange={(event) =>
                              setEditingDocumentForm((current) => ({ ...current, categoryId: event.target.value }))
                            }
                          >
                            <option value="">Sans catégorie</option>
                            {categoryOptions.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={editingDocumentForm.participantId}
                            disabled={editingDocumentForm.coachOnly}
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
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={editingDocumentForm.isVisibleToParticipant}
                              disabled={editingDocumentForm.coachOnly}
                              onChange={(event) =>
                                setEditingDocumentForm((current) => ({
                                  ...current,
                                  isVisibleToParticipant: event.target.checked,
                                }))
                              }
                            />
                            Visible côté athlète
                          </label>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            onChange={(event) => setEditingDocumentFile(event.target.files?.[0] ?? null)}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                              onClick={saveEditedDocument}
                            >
                              Sauvegarder détails
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold"
                              onClick={() => setEditingDocumentId(null)}
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
                  );
                })}
              </ul>
            ) : isAthleteDocsOpen ? (
              <p className="mt-2 text-sm text-slate-600">Aucun document athlète pour ce filtre.</p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Section repliée.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Documents des coachs</h2>
              <button
                type="button"
                onClick={() => setIsCoachDocsOpen((current) => !current)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                aria-label={isCoachDocsOpen ? "Replier" : "Déplier"}
              >
                {isCoachDocsOpen ? "▼" : "▶"}
              </button>
            </div>
            {isCoachDocsOpen && filteredCoachDocuments.length ? (
              <ul className="mt-3 space-y-2">
                {filteredCoachDocuments.map((document) => {
                  const state = resolveQuickState(document);

                  return (
                    <li key={document.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">{document.title}</p>
                      <p className="text-xs text-slate-500">Réservé aux coachs</p>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <select
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          value={state.categoryId}
                          onChange={(event) => updateQuickState(document.id, { categoryId: event.target.value })}
                        >
                          <option value="">Sans catégorie</option>
                          {categoryOptions.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveQuickDocument(document)}
                          className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditingDocument(document)}
                          className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          Modifier détails
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDocument(document.id)}
                          className="rounded-full border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700"
                        >
                          Supprimer
                        </button>
                        {documentActionMessage[document.id] ? (
                          <span className="self-center text-xs text-slate-600">{documentActionMessage[document.id]}</span>
                        ) : null}
                      </div>

                      {editingDocumentId === document.id ? (
                        <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={editingDocumentForm.coachOnly}
                              onChange={(event) =>
                                setEditingDocumentForm((current) => ({
                                  ...current,
                                  coachOnly: event.target.checked,
                                  participantId: event.target.checked
                                    ? ""
                                    : current.participantId || (participants[0]?.id ?? ""),
                                  isVisibleToParticipant: event.target.checked ? false : current.isVisibleToParticipant,
                                }))
                              }
                            />
                            Réserver aux coachs
                          </label>
                          <input
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={editingDocumentForm.title}
                            onChange={(event) =>
                              setEditingDocumentForm((current) => ({ ...current, title: event.target.value }))
                            }
                            placeholder="Titre"
                          />
                          <textarea
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={editingDocumentForm.description}
                            onChange={(event) =>
                              setEditingDocumentForm((current) => ({ ...current, description: event.target.value }))
                            }
                            placeholder="Description"
                          />
                          <select
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={editingDocumentForm.categoryId}
                            onChange={(event) =>
                              setEditingDocumentForm((current) => ({ ...current, categoryId: event.target.value }))
                            }
                          >
                            <option value="">Sans catégorie</option>
                            {categoryOptions.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <select
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={editingDocumentForm.participantId}
                            disabled={editingDocumentForm.coachOnly}
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
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={editingDocumentForm.isVisibleToParticipant}
                              disabled={editingDocumentForm.coachOnly}
                              onChange={(event) =>
                                setEditingDocumentForm((current) => ({
                                  ...current,
                                  isVisibleToParticipant: event.target.checked,
                                }))
                              }
                            />
                            Visible côté athlète
                          </label>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            onChange={(event) => setEditingDocumentFile(event.target.files?.[0] ?? null)}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                              onClick={saveEditedDocument}
                            >
                              Sauvegarder détails
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold"
                              onClick={() => setEditingDocumentId(null)}
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
                  );
                })}
              </ul>
            ) : isCoachDocsOpen ? (
              <p className="mt-2 text-sm text-slate-600">Aucun document coach pour ce filtre.</p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Section repliée.</p>
            )}
          </section>
        </div>
      ) : null}

      {section === "participants" ? (
        <div className="grid gap-6 xl:grid-cols-2">
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
            <button type="submit" className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Créer
            </button>
            {participantMessage ? <p className="mt-3 text-sm text-slate-700">{participantMessage}</p> : null}
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Participants</h2>
            <ul className="mt-3 space-y-2">
              {recentParticipants.map((participant) => (
                <li key={participant.id} className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">{participant.fullName}</span> • {participant.username}
                  </p>
                  <p className="text-xs text-slate-500">{participant.documentCount} document(s)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                      onClick={() => startEditingParticipant(participant.id)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      onClick={() => deleteParticipant(participant.id)}
                    >
                      Supprimer
                    </button>
                  </div>

                  {editingParticipantId === participant.id ? (
                    <div className="mt-2 grid gap-2 rounded-xl border border-slate-200 bg-white p-3">
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={editingParticipantForm.fullName}
                        onChange={(event) =>
                          setEditingParticipantForm((current) => ({ ...current, fullName: event.target.value }))
                        }
                      />
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={editingParticipantForm.username}
                        onChange={(event) =>
                          setEditingParticipantForm((current) => ({ ...current, username: event.target.value }))
                        }
                      />
                      <input
                        type="password"
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        value={editingParticipantForm.password}
                        onChange={(event) =>
                          setEditingParticipantForm((current) => ({ ...current, password: event.target.value }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                          onClick={saveEditedParticipant}
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                          onClick={() => setEditingParticipantId(null)}
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
          </section>
        </div>
      ) : null}

      {section === "categories" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={createCategory} className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Créer une catégorie</h2>
            <input
              required
              placeholder="Ex: Nutrition"
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
            />
            <button type="submit" className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Créer
            </button>
            {categoryMessage ? <p className="mt-3 text-sm text-slate-700">{categoryMessage}</p> : null}
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">Catégories</h2>
            <ul className="mt-3 space-y-2">
              {categoryOptions.map((category) => {
                const draft = categoryDrafts[category.id] ?? category.name;

                return (
                  <li key={category.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      value={draft}
                      onChange={(event) =>
                        setCategoryDrafts((current) => ({
                          ...current,
                          [category.id]: event.target.value,
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-slate-500">{category.documentCount} document(s)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                        onClick={() => saveCategoryRename(category.id, category.name)}
                      >
                        Renommer
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        onClick={() => deleteCategory(category.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {categoryMessage ? <p className="mt-3 text-sm text-slate-700">{categoryMessage}</p> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
