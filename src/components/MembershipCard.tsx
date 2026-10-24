import { Icon } from "@/components/Icon";
import { MembershipActions } from "@/components/MembershipActions";
import { MEMBERSHIP, MEMBER_PRICES } from "@/lib/membership";
import { formatUsd } from "@/lib/pricing";
import { fill, type Dictionary } from "@/lib/i18n";

/** Tarjeta del plan de socio, para /precios. */
export function MembershipCard({
  t,
  signedIn,
  member,
}: {
  t: Dictionary;
  signedIn: boolean;
  member: boolean;
}) {
  const m = t.membership;
  return (
    <section id="socio" className="card mx-auto mt-16 max-w-3xl rounded-[var(--radius-lg)] border-[var(--color-hairline-strong)] p-8">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h2 className="t-headline">{m.title}</h2>
          <p className="t-sub mt-1 text-[var(--color-label-2)]">{m.lede}</p>
          <ul className="mt-6 space-y-2.5">
            {m.points.map((point) => (
              <li key={point} className="t-sub flex gap-2.5 text-[var(--color-label-2)]">
                <Icon name="check" size={14} className="mt-[4px] shrink-0 text-[var(--color-label-1)]" />
                {fill(point, {
                  cinematic: formatUsd(MEMBER_PRICES.cinematic),
                  elevated: formatUsd(MEMBER_PRICES.elevated),
                })}
              </li>
            ))}
          </ul>
        </div>
        <div className="md:min-w-56 md:text-right">
          <p className="text-[2.5rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
            {formatUsd(MEMBERSHIP.monthlyUsd)}
            <span className="t-sub font-normal text-[var(--color-label-2)]">{m.perMonth}</span>
          </p>
          <p className="t-sub mt-2 tabular-nums text-[var(--color-label-2)]">
            {formatUsd(MEMBERSHIP.yearlyUsd)}
            {m.perYear}
          </p>
          <p className="t-caption mt-1 text-[var(--color-label-3)]">{m.yearlyNote}</p>
        </div>
      </div>
      <div className="mt-8">
        <MembershipActions
          mode={member ? "manage" : "join"}
          signedIn={signedIn}
          labels={{
            monthly: `${m.joinMonthly} · ${formatUsd(MEMBERSHIP.monthlyUsd)}`,
            yearly: `${m.joinYearly} · ${formatUsd(MEMBERSHIP.yearlyUsd)}`,
            manage: m.manage,
            failed: t.errors.paymentFailed,
          }}
        />
        <p className="t-caption mt-4 text-[var(--color-label-3)]">{m.cancelNote}</p>
      </div>
    </section>
  );
}
