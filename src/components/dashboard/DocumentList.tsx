"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

type DashboardDocument = {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  storageKey: string;
  updatedAt: Date;
};

type DocumentListProps = {
  documents: DashboardDocument[];
  emptyMessage: string;
};

export default function DocumentList({ documents, emptyMessage }: DocumentListProps) {
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(documents[0]?.id ?? null);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
      {documents.map((document) => (
        <article key={document.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900">{document.title}</h3>
              {document.description?.trim() ? <p className="mt-1 text-sm leading-6 text-slate-600">{document.description}</p> : null}
              <p className="mt-2 text-xs text-slate-500">Fichier: {document.fileName}</p>
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
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
              {document.updatedAt.toISOString().slice(0, 10)}
            </span>
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
                      <figure key={`${document.id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
        </article>
      ))}
    </div>
  );
}
