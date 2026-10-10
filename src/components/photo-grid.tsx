import Link from "next/link";
import { deletePhoto } from "@/app/(app)/actions";
import { formatDay } from "@/lib/format";
import type { Photo } from "@/lib/types";
import { Submit } from "./submit";

type Props = {
  photos: Photo[];
  back: string;
  jobNumbers?: Map<string, number>;
};

/** Grilla de fotos: tocar abre la foto completa; ✕ la borra. */
export function PhotoGrid({ photos, back, jobNumbers }: Props) {
  if (photos.length === 0) return <p className="text-sm text-muted">Sin fotos todavía.</p>;
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((p) => (
        <li key={p.id} className="group relative overflow-hidden rounded-xl border border-border bg-accent-soft/40">
          {p.url ? (
            <a href={p.url} target="_blank" rel="noreferrer" className="block aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? "Foto"} loading="lazy" className="h-full w-full object-cover" />
            </a>
          ) : (
            <div className="flex aspect-square items-center justify-center text-xs text-muted">Sin vista previa</div>
          )}
          <div className="flex items-center justify-between gap-1 px-2 py-1 text-[11px] text-muted">
            <span className="truncate">
              {formatDay(p.created_at.slice(0, 10))}
              {p.job_id && jobNumbers?.get(p.job_id) ? (
                <>
                  {" · "}
                  <Link href={`/casos/${p.job_id}`} className="text-accent">#{jobNumbers.get(p.job_id)}</Link>
                </>
              ) : null}
            </span>
            <form action={deletePhoto}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="back" value={back} />
              <Submit className="px-1 text-muted hover:text-danger" confirm="¿Borrar esta foto?">✕</Submit>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
