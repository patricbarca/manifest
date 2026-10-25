"use client";

import { useState } from "react";

type State = "none" | "pending" | "member";

export function CircleRequestButton({
  handle,
  initial,
  t,
  className,
}: {
  handle: string;
  initial: State;
  t: { requestJoin: string; requested: string; inCircle: string };
  className?: string;
}) {
  const [state, setState] = useState<State>(initial);
  const [busy, setBusy] = useState(false);
  async function request() {
    setBusy(true);
    const res = await fetch("/api/circle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", handle }) });
    setBusy(false);
    if (res.ok) setState("pending");
  }
  const cls = className ?? "interactive rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black";
  if (state !== "none") {
    return <span className={`${cls} cursor-default opacity-70`}>{state === "member" ? `✓ ${t.inCircle}` : t.requested}</span>;
  }
  return (
    <button type="button" onClick={request} disabled={busy} className={cls}>
      {t.requestJoin}
    </button>
  );
}
