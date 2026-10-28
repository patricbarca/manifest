---
name: revisar-web
description: Revisión completa de ManifestLifeAI (manifestlife.ai) por un equipo de 9 agentes en paralelo — developer, seguridad, legal, marketing, UX, precios, ética, usuario simulado y SEO (searchfit-seo) — y un informe único priorizado en docs/revisiones/. Úsalo cuando el usuario pida "revisa la web", "auditoría completa", "pasa el equipo de revisión", "/revisar-web", o antes de un lanzamiento. Acepta una lista de áreas para revisar solo esas (ej. "/revisar-web legal seguridad").
---

# Revisión de ManifestLifeAI con el equipo de agentes

Los agentes solo leen. Nadie edita código en esta skill: el resultado es un informe.

## 1. Comprobar acceso a la web en vivo

`curl -sS -o /dev/null -w "%{http_code}" --max-time 10 https://manifestlife.ai`
- 200 → los agentes pueden usar `WebFetch` además del código.
- Otra cosa → revisión solo de código. Díselo al usuario en una línea (el dominio se habilita en la configuración de red del entorno) y sigue.

## 2. Lanzar el equipo en paralelo

En **un solo mensaje**, una llamada `Agent` por área (o solo las que pidió el usuario):

| Área | subagent_type |
|---|---|
| Developer | `rev-developer` |
| Seguridad | `rev-seguridad` |
| Legal | `rev-legal` |
| Marketing | `rev-marketing` |
| UX y accesibilidad | `rev-ux` |
| Precios | `rev-precios` |
| Ética | `rev-etica` |
| Usuario simulado | `rev-usuario` |
| SEO | `searchfit-seo:seo-auditor:AGENT` |

Prompt para los `rev-*`: "Revisa ManifestLifeAI en /home/user/manifest según tus instrucciones. Web en vivo: <accesible | no accesible>. Devuelve solo tu tabla en el formato común."

Prompt para SEO (no conoce el formato común, dáselo): "Auditoría SEO técnica y on-page del sitio Next.js 16 en /home/user/manifest (App Router: `src/app`, `sitemap.ts`, `robots.ts`, `layout.tsx`, metadatos por página, blog, market, perfiles públicos `u/[handle]` y vídeos compartidos `s/[id]`). Dominio: manifestlife.ai. Web en vivo: <accesible | no accesible>. Solo lee, no edites. Responde en español con una tabla `| # | Gravedad | Dónde | Problema | Arreglo propuesto | Certeza |` (Gravedad Crítico/Alto/Medio/Bajo; Certeza Confirmado/Probable/Sin verificar; cita fichero:línea), máximo 12 filas."

## 3. Consolidar

- Junta los hallazgos. Fusiona duplicados (mismo problema visto por varias áreas) y anota todas las áreas que lo vieron: eso sube su prioridad.
- Comprueba tú mismo cada hallazgo **Crítico** abriendo el `fichero:línea` citado. Si no se sostiene, bájalo o descártalo y dilo.
- Ordena: Crítico → Alto → Medio → Bajo; dentro de cada nivel, primero lo que cuesta poco arreglar.

## 4. Informe

Escribe `docs/revisiones/AAAA-MM-DD.md` (fecha de hoy; si existe, añade `-2`):

```
# Revisión ManifestLifeAI — AAAA-MM-DD
Fuente: código | código + web en vivo. Áreas: …
Aviso: la revisión legal detecta riesgos; no sustituye a un abogado.

## Top 10 a arreglar primero
| # | Gravedad | Área(s) | Dónde | Problema | Arreglo | Certeza |

## Por área
### <Área> … (tabla de cada agente, ya sin duplicados)

## Lo que está bien
## Comparación con la revisión anterior   ← solo si hay una previa en docs/revisiones/
```

## 5. Responder en el chat

Solo: ruta del informe, número de hallazgos por gravedad y los Críticos/Altos en una línea cada uno. No pegues el informe.
