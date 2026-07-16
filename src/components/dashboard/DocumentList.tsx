"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

type DashboardDocument = {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  storageKey: string;
  audience: "participant" | "coach";
  isVisibleToParticipant: boolean;
  category: {
    id: string;
    name: string;
  } | null;
  participant?: {
    fullName: string;
  } | null;
  updatedAt: Date;
};

type DocumentListProps = {
  documents: DashboardDocument[];
  emptyMessage: string;
};

export default function DocumentList({ documents, emptyMessage }: DocumentListProps) {
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(documents[0]?.id ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"category" | "athlete">("category");
  const [selectedAthlete, setSelectedAthlete] = useState<string>("all");
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadingGroupKey, setDownloadingGroupKey] = useState<string | null>(null);
  const [groupDownloadMessage, setGroupDownloadMessage] = useState<string | null>(null);

  const buildGroupKey = (groupName: string, titleKey: string) => `${groupName}::${titleKey}`;

  const downloadTitleGroup = async (groupName: string, titleKey: string, title: string, items: DashboardDocument[]) => {
    const groupKey = buildGroupKey(groupName, titleKey);
    setGroupDownloadMessage(null);
    setDownloadingGroupKey(groupKey);

    try {
      const response = await fetch("/api/documents/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentIds: items.map((document) => document.id),
          groupName: title,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Impossible de télécharger ce groupe.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^\"]+)"?/i);
      const filename = match?.[1] ?? `documents-${title}.zip`;

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      setGroupDownloadMessage(`Téléchargement lancé pour ${items.length} document(s).`);
    } catch (error) {
      setGroupDownloadMessage(error instanceof Error ? error.message : "Erreur pendant le téléchargement.");
    } finally {
      setDownloadingGroupKey(null);
    }
  };

  const categoryOptions = Array.from(
    new Map(
      documents
        .filter((document) => document.category)
        .map((document) => [document.category!.id, { id: document.category!.id, name: document.category!.name }]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));

  const filteredDocuments =
    selectedCategory === "all"
      ? documents
      : documents.filter((document) => document.category?.id === selectedCategory);

  const athleteOptions = Array.from(
    new Set(filteredDocuments.map((document) => document.participant?.fullName).filter(Boolean) as string[]),
  ).sort((left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }));

  const athleteFilteredDocuments =
    sortBy === "athlete" && selectedAthlete !== "all"
      ? filteredDocuments.filter((document) => document.participant?.fullName === selectedAthlete)
      : filteredDocuments;

  const sortedDocuments = [...athleteFilteredDocuments].sort((left, right) => {
    if (sortBy === "category") {
      const leftCategory = left.category?.name ?? "Sans catégorie";
      const rightCategory = right.category?.name ?? "Sans catégorie";
      const byCategory = leftCategory.localeCompare(rightCategory, "fr", { sensitivity: "base" });

      if (byCategory !== 0) {
        return byCategory;
      }
    }

    {
      const leftAthlete = left.participant?.fullName ?? "Sans athlète";
      const rightAthlete = right.participant?.fullName ?? "Sans athlète";
      const byAthlete = leftAthlete.localeCompare(rightAthlete, "fr", { sensitivity: "base" });

      if (byAthlete !== 0) {
        return byAthlete;
      }
    }

    return left.title.localeCompare(right.title, "fr", { sensitivity: "base" });
  });

  const groupedDocuments = sortedDocuments.reduce<Record<string, DashboardDocument[]>>((accumulator, document) => {
    const groupName = sortBy === "athlete" ? document.participant?.fullName ?? "Sans athlète" : document.category?.name ?? "Sans catégorie";

    if (!accumulator[groupName]) {
      accumulator[groupName] = [];
    }

    accumulator[groupName].push(document);
    return accumulator;
  }, {});

  const sortedCategoryNames = Object.keys(groupedDocuments).sort((left, right) => {
    const bottomLabel = sortBy === "athlete" ? "Sans athlète" : "Sans catégorie";

    if (left === bottomLabel) {
      return 1;
    }

    if (right === bottomLabel) {
      return -1;
    }

    return left.localeCompare(right, "fr", { sensitivity: "base" });
  });

  useEffect(() => {
    if (selectedCategory !== "all" && !categoryOptions.some((category) => category.id === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categoryOptions, selectedCategory]);

  useEffect(() => {
    if (sortBy !== "athlete") {
      setSelectedAthlete("all");
      return;
    }

    if (selectedAthlete !== "all" && !athleteOptions.includes(selectedAthlete)) {
      setSelectedAthlete("all");
    }
  }, [athleteOptions, selectedAthlete, sortBy]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadPreview() {
      if (!openDocumentId) {
        setPreviewPages([]);
        setPreviewError(null);
        setPreviewLoading(false);
        return;
      }

      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewPages([]);

      try {
        const response = await fetch(`/api/documents/${openDocumentId}/access?disposition=inline`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Impossible de charger le document.");
        }

        const arrayBuffer = await response.arrayBuffer();
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer),
          isEvalSupported: false,
          useWorkerFetch: false,
        }).promise;

        const pageImages: string[] = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.35 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Impossible de préparer l’aperçu.");
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;
          pageImages.push(canvas.toDataURL("image/png"));
        }

        if (!active) {
          return;
        }

        setPreviewPages(pageImages);
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return;
        }

        setPreviewError(error instanceof Error ? error.message : "Impossible de charger le document.");
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      active = false;
      controller.abort();
    };
  }, [openDocumentId]);

  if (!documents.length) {
    return <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div>
          <label htmlFor="sort-documents" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            Trier les documents
          </label>
          <select
            id="sort-documents"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "category" | "athlete")}
          >
            <option value="category">Par catégorie</option>
            <option value="athlete">Par athlète</option>
          </select>
        </div>

        {sortBy === "category" ? (
          <div className="mt-3">
            <label htmlFor="category-filter" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Catégorie
            </label>
            <select
              id="category-filter"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="all">Toutes les catégories</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {(sortBy === "athlete" || sortBy === "category") && athleteOptions.length ? (
          <div className="mt-3">
            <label htmlFor="athlete-filter" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Choisir un athlète
            </label>
            <select
              id="athlete-filter"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              value={selectedAthlete}
              onChange={(event) => setSelectedAthlete(event.target.value)}
            >
              <option value="all">Tous les athlètes</option>
              {athleteOptions.map((athleteName) => (
                <option key={athleteName} value={athleteName}>
                  {athleteName}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {groupDownloadMessage ? <p className="mt-3 text-xs text-slate-600">{groupDownloadMessage}</p> : null}
      </div>

      {sortedDocuments.length ? (
        sortedCategoryNames.map((categoryName) => (
          <section key={categoryName} className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{categoryName}</h3>
            <div className="mt-3 grid gap-4">
              {Object.values(
                groupedDocuments[categoryName].reduce<
                  Record<string, { titleKey: string; displayTitle: string; items: DashboardDocument[] }>
                >((accumulator, document) => {
                  const titleKey = document.title.trim().toLocaleLowerCase("fr");

                  if (!accumulator[titleKey]) {
                    accumulator[titleKey] = {
                      titleKey,
                      displayTitle: document.title,
                      items: [],
                    };
                  }

                  accumulator[titleKey].items.push(document);
                  return accumulator;
                }, {}),
              ).map(({ titleKey, displayTitle, items: titleDocuments }) => (
                <article key={`${categoryName}-${titleKey}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-slate-400">{displayTitle}</h4>
                    <button
                      type="button"
                      onClick={() => downloadTitleGroup(categoryName, titleKey, displayTitle, titleDocuments)}
                      disabled={downloadingGroupKey === buildGroupKey(categoryName, titleKey)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingGroupKey === buildGroupKey(categoryName, titleKey)
                        ? "Préparation..."
                        : "Télécharger le groupe"}
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3">
                    {titleDocuments.map((document) => (
                      <div key={document.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {document.participant?.fullName ? (
                              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-900">
                                {document.participant.fullName}
                              </p>
                            ) : null}
                            {document.description?.trim() ? (
                              <p className="mt-1 text-sm leading-6 text-slate-600">{document.description}</p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setOpenDocumentId((current) => (current === document.id ? null : document.id))}
                                className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                              >
                                {openDocumentId === document.id ? "Masquer" : "Voir"}
                              </button>
                              <a
                                href={`/api/documents/${document.id}/access?disposition=attachment`}
                                className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Télécharger
                              </a>
                            </div>
                          </div>

                          <div className="flex min-w-[190px] self-stretch flex-col items-end justify-between gap-3 text-right">
                            <div className="flex flex-col items-end gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
                              {document.audience === "participant" ? (
                                <span
                                  className={`rounded-full px-2 py-0.5 ring-1 ${
                                    document.isVisibleToParticipant
                                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                      : "bg-amber-50 text-amber-700 ring-amber-200"
                                  }`}
                                >
                                  {document.isVisibleToParticipant ? "Visible par l'athlète" : "Masqué pour l'athlète"}
                                </span>
                              ) : (
                                <span className="rounded-full bg-white px-2 py-0.5 text-slate-500 ring-1 ring-slate-200">
                                  Visible aux coachs
                                </span>
                              )}
                            </div>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                              {document.updatedAt.toISOString().slice(0, 10)}
                            </span>
                          </div>
                        </div>
                        {openDocumentId === document.id ? (
                          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {previewLoading ? (
                              <div className="flex h-[70vh] items-center justify-center text-sm text-slate-500">Chargement de l’aperçu...</div>
                            ) : previewError ? (
                              <div className="flex h-[70vh] items-center justify-center p-6 text-center text-sm text-rose-600">{previewError}</div>
                            ) : previewPages.length ? (
                              <div className="max-h-[70vh] overflow-y-auto bg-slate-100 p-4">
                                <div className="mx-auto grid max-w-4xl gap-4">
                                  {previewPages.map((pageImage, index) => (
                                    <figure
                                      key={`${document.id}-${index}`}
                                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                                    >
                                      <img
                                        src={pageImage}
                                        alt={`Page ${index + 1} du document ${document.title}`}
                                        className="block h-auto w-full"
                                      />
                                      <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                                        Page {index + 1} sur {previewPages.length}
                                      </figcaption>
                                    </figure>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Aucun document dans cette catégorie.
        </p>
      )}
    </div>
  );
}
