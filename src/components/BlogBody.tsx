import type { Block } from "@/lib/blog";

/** Pinta el cuerpo de un artículo a partir de bloques simples. */
export function BlogBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="t-headline pt-6">
                {b.text}
              </h2>
            );
          case "p":
            return (
              <p key={i} className="t-body leading-relaxed text-[var(--color-label-2)]">
                {b.text}
              </p>
            );
          case "ul":
          case "ol": {
            const List = b.type;
            return (
              <List
                key={i}
                className={`t-body space-y-2 pl-6 text-[var(--color-label-2)] ${
                  b.type === "ul" ? "list-disc" : "list-decimal"
                }`}
              >
                {b.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </List>
            );
          }
          case "quote":
            return (
              <blockquote
                key={i}
                className="t-headline border-l-2 border-[var(--color-hairline-strong)] py-1 pl-5 text-balance"
              >
                {b.text}
              </blockquote>
            );
        }
      })}
    </div>
  );
}
