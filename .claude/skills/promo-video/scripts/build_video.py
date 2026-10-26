"""Monta un vídeo promocional vertical (1080x1920) de ManifestLifeAI a partir de un spec JSON.

Uso:
  FFMPEG_PATH=... python3 build_video.py spec.json

El spec describe clips, voces y textos; este script solo edita (no gasta en IA).
Dos estilos:
  - "promo":  fundidos cruzados, subtítulos serif abajo con degradado, cierre con logo.
  - "tiktok": cortes secos, gancho arriba (POV) y frases cortas grandes con contorno.

Spec (campos):
{
  "style": "promo" | "tiktok",
  "out": "/ruta/salida.mp4",
  "workdir": "/ruta/temporal",                # opcional (por defecto junto a out)
  "shots": [{"src": "clip.mp4", "start": 0, "secs": 6.5}],
  "voice": [{"file": "v0.mp3", "at": 0.6, "caption": "texto"}],   # caption: str, lista de frases o null
  "hook": {"top": "POV:", "text": "…"},        # solo tiktok, opcional
  "end": {"secs": 8, "tagline": "See it. Feel it. Live it.", "cta": "Create your first video, free",
          "lines": ["Make yours.", "Link in bio ↓"], "bg": "bg.mp4"},   # bg opcional (si no, degradado)
  "music_volume": 0.32
}
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
FONTS = f"{REPO}/render/fonts"
MARK = f"{REPO}/public/brand/mark-512.png"
FF = os.environ.get("FFMPEG_PATH", "ffmpeg")
W, H, FPS = 1080, 1920, 30

spec = json.load(open(sys.argv[1]))
STYLE = spec.get("style", "promo")
OUT = spec["out"]
T = spec.get("workdir") or os.path.join(os.path.dirname(os.path.abspath(OUT)), "build")
os.makedirs(T, exist_ok=True)


def run(args):
    subprocess.run([FF, "-y", "-loglevel", "error", *args], check=True)


def dur(path):
    r = subprocess.run([FF, "-i", path], capture_output=True, text=True)
    h, m, s = r.stderr.split("Duration: ")[1].split(",")[0].split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def font(name, size, axes=None):
    f = ImageFont.truetype(f"{FONTS}/{name}", size)
    if axes:
        try:
            f.set_variation_by_axes(axes)  # Inter: [opsz, wght]; Cormorant: [wght]
        except Exception:
            pass
    return f


def wrap(d, text, f, maxw):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = w
    return lines + [cur]


def serif_caption(text, out):
    """Subtítulo elegante abajo, con sombra y degradado oscuro para leerse sobre escenas claras."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font("CormorantGaramond.ttf", 66, [500])
    lines = wrap(d, text, f, W - 200)
    lh = 74
    y0 = H - 330 - lh * len(lines)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for i, ln in enumerate(lines):
        x = (W - d.textlength(ln, font=f)) / 2
        sd.text((x, y0 + i * lh), ln, font=f, fill=(0, 0, 0, 200))
        d.text((x, y0 + i * lh), ln, font=f, fill=(255, 255, 255, 255))
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    top = y0 - 260
    for y in range(max(0, top), H):
        gd.line([(0, y), (W, y)], fill=(10, 6, 12, int(170 * min(1, (y - top) / 320))))
    grad.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(10)))
    grad.alpha_composite(img)
    grad.save(out)


def bold_caption(text, out, size=84, yc=0.17, top=None):
    """Texto TikTok: grande, blanco con contorno negro."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font("Inter.ttf", size, [32, 700])
    lines = wrap(d, text, f, W - 160)
    lh = int(size * 1.22)
    y0 = int(H * yc - lh * len(lines) / 2)
    if top:
        ft = font("Inter.ttf", int(size * 1.35), [32, 800])
        d.text(((W - d.textlength(top, font=ft)) / 2, y0 - int(size * 1.7)), top, font=ft,
               fill=(255, 214, 160, 255), stroke_width=9, stroke_fill=(0, 0, 0, 255))
    for i, ln in enumerate(lines):
        d.text(((W - d.textlength(ln, font=f)) / 2, y0 + i * lh), ln, font=f,
               fill=(255, 255, 255, 255), stroke_width=9, stroke_fill=(0, 0, 0, 255))
    img.save(out)


def end_card(out, e):
    """Cierre: símbolo, nombre, lema y botón/frases de llamada a la acción."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    mark = Image.open(MARK).convert("RGBA").resize((300, 300))
    img.alpha_composite(mark, ((W - 300) // 2, 560))
    name = font("Inter.ttf", 76, [32, 650])
    d.text(((W - d.textlength("ManifestLifeAI", font=name)) / 2, 900), "ManifestLifeAI", font=name, fill=(255, 255, 255, 255))
    if e.get("tagline"):
        f = font("CormorantGaramond-Italic.ttf", 58)
        d.text(((W - d.textlength(e["tagline"], font=f)) / 2, 1010), e["tagline"], font=f, fill=(255, 240, 230, 255))
    y = 1150
    if e.get("cta"):
        fi = font("Inter.ttf", 44, [32, 600])
        tw = d.textlength(e["cta"], font=fi)
        x0 = (W - tw) / 2 - 48
        d.rounded_rectangle([x0, y, x0 + tw + 96, y + 104], radius=52, fill=(255, 255, 255, 235))
        d.text((x0 + 48, y + 26), e["cta"], font=fi, fill=(20, 14, 24, 255))
        y += 160
    for ln in e.get("lines", []):
        f = font("Inter.ttf", 64, [32, 700])
        d.text(((W - d.textlength(ln, font=f)) / 2, y), ln, font=f, fill=(255, 255, 255, 255))
        y += 96
    img.save(out)


# 1. Clips al formato final (sin audio, 30 fps, rellenando si el clip es corto).
parts = []
for i, s in enumerate(spec["shots"]):
    o = f"{T}/s{i}.mp4"
    run(["-ss", str(s.get("start", 0)), "-i", s["src"], "-t", str(s["secs"]), "-an", "-vf",
         f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},"
         f"tpad=stop_mode=clone:stop_duration=3,trim=0:{s['secs']},setpts=PTS-STARTPTS,format=yuv420p",
         "-c:v", "libx264", "-crf", "16", "-preset", "fast", o])
    parts.append((o, float(s["secs"])))

# 2. Cierre de marca.
e = spec.get("end")
if e:
    end_card(f"{T}/end.png", e)
    secs = float(e.get("secs", 8))
    bg = (["-stream_loop", "-1", "-i", e["bg"]] if e.get("bg")
          else ["-f", "lavfi", "-i", f"gradients=s={W}x{H}:c0=0x2a1530:c1=0xf2b8a6:speed=0.01:r={FPS}"])
    run([*bg, "-loop", "1", "-i", f"{T}/end.png", "-t", str(secs), "-filter_complex",
         f"[0:v]scale={W}:{H},fps={FPS}[b];[b][1:v]overlay=0:0,fade=in:st=0:d=0.8,format=yuv420p[v]",
         "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "16", "-preset", "fast", f"{T}/s_end.mp4"])
    parts.append((f"{T}/s_end.mp4", secs))

# 3. Unir: fundidos (promo) o cortes secos (tiktok). Se normaliza fps/timebase (si no, xfade falla).
inputs = sum([["-i", p] for p, _ in parts], [])
chain = "".join(f"[{i}:v]settb=AVTB,setpts=PTS-STARTPTS,fps={FPS},setsar=1,format=yuv420p[p{i}];" for i in range(len(parts)))
if STYLE == "promo" and len(parts) > 1:
    XF, off, label = 0.6, 0.0, "[p0]"
    for i in range(1, len(parts)):
        off += parts[i - 1][1] - XF
        chain += f"{label}[p{i}]xfade=transition=fade:duration={XF}:offset={off:.2f}[x{i}];"
        label = f"[x{i}]"
    total = sum(s for _, s in parts) - XF * (len(parts) - 1)
else:
    chain += "".join(f"[p{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=1:a=0[x];"
    label, total = "[x]", sum(s for _, s in parts)

# 4. Textos encima (PNG con -loop 1; un PNG suelto sin loop dura un fotograma).
overlays = []
if STYLE == "tiktok" and spec.get("hook"):
    bold_caption(spec["hook"]["text"], f"{T}/hook.png", size=70, yc=0.30, top=spec["hook"].get("top"))
    first = spec["voice"][1]["at"] if len(spec["voice"]) > 1 else 5.0
    overlays.append((f"{T}/hook.png", 0.0, first - 0.1))
for k, v in enumerate(spec["voice"]):
    cap = v.get("caption")
    if not cap:
        continue
    d = dur(v["file"])
    if STYLE == "tiktok":
        chunks = cap if isinstance(cap, list) else [cap]
        step = d / len(chunks)
        for j, c in enumerate(chunks):
            png = f"{T}/c{k}_{j}.png"
            bold_caption(c, png)
            overlays.append((png, v["at"] + j * step, v["at"] + (j + 1) * step))
    else:
        png = f"{T}/c{k}.png"
        serif_caption(cap if isinstance(cap, str) else " ".join(cap), png)
        overlays.append((png, v["at"], v["at"] + d + 0.3))
n = len(parts)
for j, (png, a, b) in enumerate(overlays):
    inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{total:.2f}", "-i", png]
    chain += f"{label}[{n + j}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[o{j}];"
    label = f"[o{j}]"
chain += f"{label}format=yuv420p[vout]"
run([*inputs, "-filter_complex", chain, "-map", "[vout]", "-t", f"{total:.2f}",
     "-c:v", "libx264", "-crf", "17", "-preset", "medium", f"{T}/video.mp4"])

# 5. Voz en su sitio + música propia por debajo, que baja cuando hay voz (sidechain).
subprocess.run([sys.executable, f"{REPO}/render/music.py", f"{total + 1:.2f}", f"{T}/music.wav"], check=True)
vo = spec["voice"]
ain = sum([["-i", v["file"]] for v in vo], [])
amix = "".join(f"[{i + 1}:a]aresample=44100,aformat=channel_layouts=stereo,adelay={int(v['at'] * 1000)}|{int(v['at'] * 1000)}[a{i}];" for i, v in enumerate(vo))
amix += "".join(f"[a{i}]" for i in range(len(vo))) + f"amix=inputs={len(vo)}:normalize=0[vo];"
amix += f"[vo]asplit=2[v1][v2];[{len(vo) + 1}:a]volume={spec.get('music_volume', 0.32)}[m];[m][v1]sidechaincompress=threshold=0.015:ratio=5:attack=40:release=900[md];"
amix += f"[v2][md]amix=inputs=2:normalize=0:duration=longest,atrim=0:{total:.2f},afade=out:st={max(0, total - 2):.2f}:d=2[ao]"
run(["-i", f"{T}/video.mp4", *ain, "-i", f"{T}/music.wav", "-filter_complex", amix, "-map", "0:v", "-map", "[ao]",
     "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT])
print("ok", OUT, round(dur(OUT), 1), "s")
