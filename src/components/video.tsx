import { videoEmbedUrl } from "@/lib/calc";

/** Mostra un vídeo incrustat (YouTube/Vimeo) o un enllaç si no es pot incrustar. */
export function VideoEmbed({ url, title }: { url: string | null; title: string }) {
  if (!url) return null;
  const embed = videoEmbedUrl(url);
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-accent underline">
        ▶ Obrir vídeo de demostració
      </a>
    );
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-surface-2">
      <iframe
        src={embed}
        title={`Vídeo: ${title}`}
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full"
      />
    </div>
  );
}
