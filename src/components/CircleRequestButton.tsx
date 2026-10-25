"use client";

import { useState } from "react";

export function CircleRequestButton({ handle, initial, t }: { handle: string; initial: "none" | "pending"; t: { requestJoin: string; requested: string } }) {
  const [state, setState] = useState(initial);
  async function request() {
    const res = await fetch("/api/circle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", handle }) });
    if (res.ok) setState("pending");
  }
  return state === "pending" ? (
    <p className="t-sub text-[var(--color-label-2)]">{t.requested}</p>
  ) : (
    <button type="button" onClick={request} className="interactive rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black">
      {t.requestJoin}
    </button>
  );
}
