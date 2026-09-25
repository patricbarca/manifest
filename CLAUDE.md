# Reglas de esta sesión

## Brevedad

- Responde en viñetas. Sin recapitular lo ya dicho ni repetir el enunciado.
- No pegues en el chat el contenido de ficheros que acabas de escribir.
- No expliques lo que vas a hacer antes de hacerlo: hazlo y resume el resultado.
- Nada de "resumen final" salvo que el cambio sea grande o lo pida.

## Lectura de ficheros y comandos

- `sed -n 'A,Bp'` o `grep -n` en vez de leer ficheros enteros.
- Filtra la salida de los comandos (`| tail`, `| grep -E`) en vez de volcarla entera.
- No releas un fichero para comprobar una edición: si `Edit` no dio error, se aplicó.

## Capturas

- Las capturas de pantalla son de lo más caro que hay. Sácalas solo si las pido,
  o si un cambio visual necesita prueba de que funciona.
- Una por cambio, no una por página.

## Verificación

- Verificar sigue siendo obligatorio: build, typecheck y probar de verdad.
- Ahorra en cómo lo cuentas, no en si lo haces.

## Delegación a modelos más baratos

- Buscar en el código (dónde está algo, qué lo usa, barrer muchos ficheros):
  delega en el subagente `buscar` (Haiku) en vez de hacerlo en la sesión principal.
- Verificación mecánica (build, typecheck, lint): delega en `chequeo` (Sonnet).
- El razonamiento de producto, precios, arquitectura y seguridad NO se delega.

@AGENTS.md
