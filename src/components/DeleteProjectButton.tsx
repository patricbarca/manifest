"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Borra el vídeo y las fotos con las que se hizo, tras confirmar. */
export function DeleteProjectButton({
  id,
  labels,
}: {
  id: string;
  labels: { delete: string; confirm: string; deleting: string; failed: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function remove() {
    if (!window.confirm(labels.confirm)) return;
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? labels.failed);
      router.push("/profile?tab=today");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md px-6 pb-10 text-center">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="t-caption text-[var(--color-label-3)] underline underline-offset-4 hover:text-[var(--color-label-1)] disabled:opacity-50"
      >
        {busy ? labels.deleting : labels.delete}
      </button>
      {error && <p className="t-caption mt-2 text-red-300">{error}</p>}
    </div>
  );
}
