export type Visibility = "private" | "circle" | "public";

export interface Profile {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  mantra?: string;
  link?: string;
  location?: string;
  visibility: Visibility;
  createdAt: number;
  /** Color y movimiento del aura de sus círculos de highlights. */
  highlightAura?: import("./aura-style").AuraStyle;
}

export interface AuraView {
  userId: string;
  projectId: string;
  /** Fecha local de la persona, AAAA-MM-DD. */
  day: string;
  points: number;
}

export interface CircleLink {
  ownerId: string;
  memberId: string;
  status: "pending" | "accepted";
  createdAt: number;
}
