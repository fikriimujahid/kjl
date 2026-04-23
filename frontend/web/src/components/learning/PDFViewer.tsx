interface PDFViewerProps {
  src: string;
  title?: string;
}

export default function PDFViewer({ src, title }: PDFViewerProps) {
  return (
    <div className="flex flex-col gap-3">
      {title && (
        <p className="text-sm font-medium text-gray-800">📄 {title}</p>
      )}

      {/* Inline embed — works for signed URLs pointing to PDFs */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
        <iframe
          src={src}
          title={title ?? "PDF Materi"}
          className="w-full"
          style={{ height: "70vh", minHeight: 400 }}
          aria-label={title ?? "PDF Materi"}
        />
      </div>

      {/* Fallback download link */}
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Buka di tab baru
      </a>
    </div>
  );
}
