"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addPhoto } from "@/app/(app)/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";

const MAX_SIDE = 1600;

/** Achica la foto antes de subirla (las del celular pesan varios MB). */
async function compress(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return blob ?? file;
  } catch {
    return file; // Formato que el navegador no sabe leer: se sube tal cual.
  }
}

export function PhotoUploader({ clientId, jobId, label = "＋ Agregar fotos" }: { clientId: string; jobId?: string; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList) {
    setError(null);
    const supabase = createBrowserSupabase();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) {
      setError("La sesión venció. Volvé a entrar.");
      return;
    }

    const list = Array.from(files);
    let done = 0;
    for (const file of list) {
      setStatus(`Subiendo ${done + 1} de ${list.length}…`);
      const blob = await compress(file);
      const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${userId}/${clientId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("photos").upload(path, blob, { contentType: blob.type || file.type });
      if (uploadError) {
        setError(`No se pudo subir ${file.name}: ${uploadError.message}`);
        break;
      }
      const result = await addPhoto({ path, clientId, jobId });
      if (result.error) {
        setError(result.error);
        break;
      }
      done += 1;
    }
    setStatus(null);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <label className={`btn-ghost btn-sm cursor-pointer ${status ? "pointer-events-none opacity-60" : ""}`}>
        {status ?? label}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
