import { MembershipActions } from "@/components/MembershipActions";
import { creditsLeft, isMember } from "@/lib/membership";
import { fill, type Dictionary } from "@/lib/i18n";
import type { User } from "@/lib/types";

/** Estado del plan de socio en la biblioteca. No pinta nada si nunca fue socio. */
export function MembershipPanel({
  user,
  t,
  locale,
  justJoined,
}: {
  user: User;
  t: Dictionary;
  locale: string;
  justJoined: boolean;
}) {
  const m = t.membership;
  const ms = user.membership;
  if (!ms) {
    return justJoined ? (
      <p className="card t-sub mt-8 rounded-[var(--radius-lg)] p-5 text-[var(--color-label-2)]">{m.processing}</p>
    ) : null;
  }
  if (ms.status === "canceled") return null;

  const date = new Date(ms.currentPeriodEnd).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="card mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[var(--radius-lg)] p-5">
      <div>
        <p className="t-sub font-medium">{justJoined ? m.welcome : m.youAreMember}</p>
        {ms.status === "past_due" ? (
          <p className="t-caption mt-1 text-red-300">{m.pastDue}</p>
        ) : (
          <p className="t-caption mt-1 text-[var(--color-label-2)]">
            {fill(m.credits, { n: isMember(user) ? creditsLeft(user) : 0 })}
            {ms.currentPeriodEnd > 0 && (
              <> · {fill(ms.cancelAtPeriodEnd ? m.ends : m.renews, { date })}</>
            )}
          </p>
        )}
      </div>
      <MembershipActions
        mode="manage"
        signedIn
        labels={{ monthly: "", yearly: "", manage: m.manage, failed: t.errors.paymentFailed }}
      />
    </div>
  );
}
