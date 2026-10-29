"use client";
import { useState } from "react";
import { PhotoSlots } from "@/components/PhotoSlots";
import { es } from "@/lib/i18n/es";
export default function P() {
  const [u, setU] = useState<(string | undefined)[]>(["/videos/demo-woman-en.jpg"]);
  return <div className="mx-auto max-w-md p-6"><PhotoSlots urls={u} onPick={() => {}} onRemove={() => setU([])} t={es.photoGuide} /></div>;
}
