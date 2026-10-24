"""ManifestLifeAI — montaje del vídeo, estilo "liquid glass".

Fondo de luz en movimiento continuo, paneles de vidrio esmerilado sobre él y
sobre las fotos, logo como esfera de vidrio. El fondo fluye sin cortes de un
tramo a otro porque cada tramo arranca donde terminó el anterior.

Uso: python3 build_glass.py job.json

El job lo escribe la app (src/lib/render/glass.ts) con rutas absolutas:
  brand, palette, texts{...}, scenes[{image, video?}], voices{...},
  work_dir, out
"""
import json, math, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FF = os.environ.get("FFMPEG_PATH") or "ffmpeg"
W, H, FPS = 1080, 1920, 30
JOB = json.load(open(sys.argv[1]))
X = JOB
L = JOB["texts"]
BRAND = JOB.get("brand", "ManifestLifeAI")
T = JOB["work_dir"]
OUT = JOB["out"]
os.makedirs(T, exist_ok=True)
FD = os.path.join(HERE, "fonts")
WHITE = (255, 255, 255)
CX, CY = W // 2, H // 2


def serif(size, weight=500, italic=False):
    f = ImageFont.truetype(f"{FD}/CormorantGaramond{'-Italic' if italic else ''}.ttf", size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def sans(size, weight=500):
    f = ImageFont.truetype(f"{FD}/Inter.ttf", size)
    try:
        f.set_variation_by_axes([14, weight])
    except Exception:
        pass
    return f


def dur(path):
    r = subprocess.run([FF, "-i", path], capture_output=True, text=True)
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def voice(k):
    return JOB["voices"][k]


# ── Fondo: manchas de luz cálidas que derivan despacio (bucle de 20 s) ──────

LOOP = 20.0
BG = f"{T}/bg.mp4"


# Paletas: el usuario elige una (o pasa la suya en el config como
# "palette": {"base": [r,g,b], "colors": [[r,g,b] x5]}).
PALETTES = {
    "dusk":     {"base": (26, 18, 40), "colors": [(246, 178, 150), (214, 140, 178), (150, 136, 220), (240, 196, 120), (120, 170, 200)]},
    "ocean":    {"base": (8, 22, 38), "colors": [(110, 200, 220), (80, 140, 220), (150, 220, 200), (200, 230, 240), (90, 110, 200)]},
    "sage":     {"base": (18, 28, 22), "colors": [(170, 200, 160), (220, 210, 170), (130, 170, 150), (240, 225, 190), (110, 150, 130)]},
    "rose":     {"base": (34, 16, 24), "colors": [(240, 170, 180), (250, 205, 190), (200, 120, 150), (255, 220, 210), (170, 110, 160)]},
    "lavender": {"base": (22, 18, 40), "colors": [(190, 170, 240), (230, 190, 240), (150, 150, 230), (240, 220, 250), (130, 120, 210)]},
    "gold":     {"base": (24, 18, 10), "colors": [(240, 200, 120), (250, 225, 170), (210, 160, 90), (255, 235, 200), (190, 140, 80)]},
}


def make_bg():
    w, h = 270, 480
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    pal = X.get("palette", "dusk")
    pal = PALETTES[pal] if isinstance(pal, str) else pal
    base = np.array(pal["base"], np.float32)
    shapes = [  # radio, centro, amplitud, frecuencias (enteras → bucle perfecto)
        (0.55, (0.30, 0.25), (0.18, 0.10), (1, 2)),
        (0.50, (0.75, 0.45), (0.15, 0.14), (2, 1)),
        (0.60, (0.35, 0.75), (0.20, 0.10), (1, 1)),
        (0.35, (0.70, 0.15), (0.12, 0.08), (3, 2)),
        (0.40, (0.20, 0.95), (0.10, 0.10), (2, 3)),
    ]
    blobs = [(tuple(c),) + s for c, s in zip(pal["colors"], shapes)]
    p = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
                          "-vf", f"scale={W}:{H}:flags=bicubic,gblur=sigma=6,noise=alls=3:allf=t,format=yuv420p",
                          "-c:v", "libx264", "-crf", "17", BG], stdin=subprocess.PIPE)
    n = int(LOOP * FPS)
    for i in range(n):
        ph = 2 * math.pi * i / n
        img = np.tile(base, (h, w, 1))
        for k, (col, r, (cx, cy), (ax, ay), (fx, fy)) in enumerate(blobs):
            x = (cx + ax * math.sin(fx * ph + k)) * w
            y = (cy + ay * math.cos(fy * ph + 2 * k)) * h
            rr = r * w * (1 + 0.08 * math.sin(ph + k))
            g = np.exp(-((xx - x) ** 2 + (yy - y) ** 2) / (2 * rr ** 2))[..., None]
            img = img * (1 - 0.62 * g) + np.array(col, np.float32) * 0.62 * g
        img = (img * 0.92).clip(0, 255).astype(np.uint8)
        p.stdin.write(img.tobytes())
    p.stdin.close()
    p.wait()


# ── Dibujo: vidrio, texto con sombra suave ─────────────────────────────────

def rr_mask(size, box, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle(box, radius=radius, fill=255)
    return m


def glass_panel(img, box, radius=56, tint=30):
    """Panel de vidrio: sombra, velo claro, brillo superior y borde luminoso."""
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + 22, x1, y1 + 22), radius=radius, fill=(10, 6, 20, 80))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(30)))
    m = rr_mask(img.size, box, radius)
    # Velo con degradado: más claro arriba, como luz que entra por el borde.
    grad = Image.new("L", img.size, 0)
    gd = ImageDraw.Draw(grad)
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        gd.line([(x0, y), (x1, y)], fill=int(tint + 34 * (1 - t) ** 2))
    veil = Image.new("RGBA", img.size, WHITE + (0,))
    veil.putalpha(Image.composite(grad, Image.new("L", img.size, 0), m))
    img.alpha_composite(veil)
    # Borde: fino, más brillante arriba a la izquierda.
    edge = Image.new("L", img.size, 0)
    ImageDraw.Draw(edge).rounded_rectangle(box, radius=radius, outline=255, width=2)
    lit = Image.new("L", img.size, 0)
    ld = ImageDraw.Draw(lit)
    for y in range(y0 - 2, y1 + 3):
        t = (y - y0) / max(1, y1 - y0)
        ld.line([(x0 - 2, y), (x1 + 2, y)], fill=int(60 + 150 * max(0.0, 1 - t * 1.6)))
    rim = Image.new("RGBA", img.size, WHITE + (0,))
    rim.putalpha(Image.composite(lit, Image.new("L", img.size, 0), edge))
    img.alpha_composite(rim)


def wrap(d, text, font, maxw):
    lines, cur = [], ""
    for w_ in text.split():
        t = (cur + " " + w_).strip()
        if d.textlength(t, font=font) > maxw and cur:
            lines.append(cur)
            cur = w_
        else:
            cur = t
    return lines + [cur]


class TextLayer:
    """Texto blanco con sombra difusa para que se lea sobre cualquier fondo."""

    def __init__(self):
        self.im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def block(self, text, font, yc, fill=WHITE, maxw=W - 220, lh=1.2):
        lines = wrap(self.d, text, font, maxw)
        step = font.size * lh
        y = yc - step * len(lines) / 2
        for l in lines:
            self.d.text(((W - self.d.textlength(l, font=font)) / 2, y), l, font=font, fill=fill)
            y += step
        return y

    def tracked(self, xy, text, font, fill=WHITE, spacing=7):
        text = text.upper()
        ws = [self.d.textlength(c, font=font) for c in text]
        x = xy[0] - (sum(ws) + spacing * (len(text) - 1)) / 2
        for c, w_ in zip(text, ws):
            self.d.text((x, xy[1]), c, font=font, fill=fill)
            x += w_ + spacing

    def onto(self, img):
        a = self.im.getchannel("A").filter(ImageFilter.GaussianBlur(7))
        sh = Image.new("RGBA", (W, H), (12, 6, 24, 0))
        sh.putalpha(a.point(lambda v: int(v * 0.55)))
        img.alpha_composite(sh)
        img.alpha_composite(self.im)


def mini_mark(img, y=150, r=16):
    d = ImageDraw.Draw(img)
    d.ellipse([CX - r, y - r, CX + r, y + r], outline=WHITE + (200,), width=2)
    d.line([(CX - r - 8, y + 5), (CX + r + 8, y + 5)], fill=WHITE + (200,), width=2)


def orb(size, warm=True):
    """Esfera de vidrio: borde luminoso (fresnel), reflejo arriba, calor abajo."""
    S = size
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    pad = S * 0.12
    R = S / 2 - pad
    c = S / 2
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([c - R - 10, c - R - 10, c + R + 10, c + R + 10], fill=WHITE + (60,))
    im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(S * 0.05)))
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    rho = np.sqrt((xx - c) ** 2 + (yy - c) ** 2) / R
    inside = rho <= 1
    alpha = np.where(inside, 14 + 70 * rho ** 4, 0).astype(np.uint8)
    body = Image.fromarray(np.dstack([np.full((S, S), 255, np.uint8)] * 3 + [alpha]), "RGBA")
    im.alpha_composite(body)
    if warm:
        w_ = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(w_).ellipse([c - R * 0.7, c + R * 0.15, c + R * 0.7, c + R * 0.95], fill=(255, 190, 150, 90))
        im.alpha_composite(w_.filter(ImageFilter.GaussianBlur(R * 0.18)))
    sp = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(sp).ellipse([c - R * 0.62, c - R * 0.82, c + R * 0.05, c - R * 0.38], fill=WHITE + (150,))
    im.alpha_composite(sp.filter(ImageFilter.GaussianBlur(R * 0.08)))
    ImageDraw.Draw(im).ellipse([c - R, c - R, c + R, c + R], outline=WHITE + (190,), width=max(2, int(S / 260)))
    return im


# ── Piezas gráficas ────────────────────────────────────────────────────────

def logo_png(out, sub=None):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    R = 150
    oy = CY - 170
    o = orb(2 * R + 80)
    img.alpha_composite(o, (CX - o.width // 2, oy - o.height // 2))
    d = ImageDraw.Draw(img)
    # El sol que asoma sobre el horizonte, dentro de la esfera.
    sun = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sun)
    sd.pieslice([CX - 52, oy - 22, CX + 52, oy + 82], 180, 360, fill=(255, 214, 160, 235))
    img.alpha_composite(sun)
    d.line([(CX - R - 30, oy + 30), (CX + R + 30, oy + 30)], fill=WHITE + (210,), width=2)
    tl = TextLayer()
    tl.block(BRAND, serif(112, 500), oy + R + 150)
    tl.block(sub or L["tagline"], serif(50, 400, italic=True), oy + R + 255, fill=(255, 240, 230))
    tl.onto(img)
    img.save(out)


def quote_png(out, q):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glass_panel(img, (70, CY - 430, W - 70, CY + 380))
    mini_mark(img, CY - 340)
    tl = TextLayer()
    end = tl.block(q["text"], serif(74, 400, italic=True), CY - 40, maxw=W - 260, lh=1.25)
    tl.tracked((CX, end + 60), q["author"], sans(28, 500))
    tl.onto(img)
    img.save(out)


def label_png(out, text):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tl = TextLayer()
    tl.tracked((CX, CY - 18), text, sans(36, 500), spacing=10)
    tl.onto(img)
    img.save(out)


def scene_parts(i, text):
    """Capa de texto + panel para una foto. Devuelve la caja del panel."""
    probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    af = serif(80, 600)
    nl = len(wrap(probe, text, af, 820))
    ph = 110 + nl * 96 + 70
    box = (60, H - 150 - ph, W - 60, H - 150)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in range(0, 260):  # oscurece un poco arriba para el logo mínimo
        d.line([(0, y), (W, y)], fill=(10, 6, 20, int(110 * (1 - y / 260))))
    mini_mark(img, 110, 15)
    glass_panel(img, box, tint=18)
    tl = TextLayer()
    tl.tracked((CX, box[1] + 52), L["repeatLabel"], sans(26, 500), spacing=9)
    tl.block(text, af, box[1] + 110 + nl * 96 / 2, maxw=820)
    tl.onto(img)
    img.save(f"{T}/ov{i}.png")
    rr_mask((box[2] - box[0], box[3] - box[1]), (0, 0, box[2] - box[0] - 1, box[3] - box[1] - 1), 56).save(f"{T}/mask{i}.png")
    return box


def close_png(out, k):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glass_panel(img, (70, CY - 330, W - 70, CY + 320))
    tl = TextLayer()
    tl.tracked((CX, CY - 240), L["repeatAfterMe"], sans(28, 500), spacing=9)
    tl.block(L["closeLine"], serif(90, 500), CY - 10, maxw=W - 240)
    tl.onto(img)
    d = ImageDraw.Draw(img)
    for j in range(3):
        x = CX + (j - 1) * 46
        d.ellipse([x - 9, CY + 220 - 9, x + 9, CY + 220 + 9], outline=WHITE + (230,), width=2,
                  fill=WHITE + (230,) if j <= k else None)
    img.save(out)


def text_png(out, text, size=96):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tl = TextLayer()
    tl.block(text, serif(size, 500), CY)
    tl.onto(img)
    img.save(out)


# ── Montaje ────────────────────────────────────────────────────────────────

segs = []
clock = [0.0]  # tiempo global, para que el fondo continúe entre tramos


def audio_graph(clips, first_input, length):
    if not clips:
        return f"anullsrc=r=44100:cl=mono,atrim=0:{length:.2f}[ao]", []
    parts, labels, inputs = [], [], []
    for k, (f, st) in enumerate(clips):
        inputs += ["-i", f]
        parts.append(f"[{first_input + k}:a]adelay={int(st * 1000)}:all=1,aformat=sample_rates=44100:channel_layouts=mono[c{k}]")
        labels.append(f"[c{k}]")
    parts.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{length:.2f}[ao]")
    return ";".join(parts), inputs


def bg_in():
    return ["-stream_loop", "-1", "-ss", f"{clock[0] % LOOP:.3f}", "-i", BG]


def encode(video_in, vf, clips, length, name):
    out = f"{T}/{len(segs):03d}_{name}.mp4"
    n_video = video_in.count("-i")
    ag, ain = audio_graph(clips, n_video, length)
    subprocess.run([FF, "-y", "-loglevel", "error", *video_in, *ain, "-filter_complex", vf + ";" + ag,
                    "-map", "[vo]", "-map", "[ao]", "-t", f"{length:.2f}", "-r", str(FPS),
                    "-c:v", "libx264", "-crf", "19", "-c:a", "aac", "-b:a", "160k", out], check=True)
    segs.append(out)
    clock[0] += length


def afade(length, fin=0.8, fout=0.7, st=0.15):
    return f"fade=in:st={st}:d={fin}:alpha=1,fade=out:st={length - fout - 0.05:.2f}:d={fout}:alpha=1"


def card(png, length, clips=(), name="card", fin=0.8, fout=0.7):
    vf = (f"[1]format=rgba,{afade(length, fin, fout)}[ov];"
          f"[0][ov]overlay=0:0,format=yuv420p[vo]")
    encode([*bg_in(), "-loop", "1", "-framerate", str(FPS), "-i", png], vf, list(clips), length, name)


make_bg()

# 1 · Logo
logo_png(f"{T}/logo.png")
card(f"{T}/logo.png", 4.4, name="logo", fin=1.2)

# 2 · Una frase
q = L["quote"]
quote_png(f"{T}/quote.png", q)
card(f"{T}/quote.png", 0.8 + dur(voice("q0")) + 1.6, [(voice("q0"), 0.8)], "quote")

# 3 · Respiración: la esfera crece al inhalar y se recoge al soltar, con la voz
INH, EXH, CYC = 4, 6, 2
R0, R1 = 150, 380
intro = round(0.6 + dur(voice("welcome")) + 0.8, 2)
blen = intro + CYC * (INH + EXH)
S1 = 2 * R1 + 200  # tamaño de la esfera grande, con su halo
orb(S1).save(f"{T}/orb.png")
label_png(f"{T}/lin.png", L["breathIn"])
label_png(f"{T}/lout.png", L["breathOut"])
# Radio en función del tiempo, como expresión de ffmpeg
ease = lambda a, b: f"(0.5-0.5*cos(PI*(t-{a})/{b - a}))"
expr = f"({R0}+6*sin(2*PI*t/3))"
ins, outs, clips = [], [], [(voice("welcome"), 0.6)]
t0 = intro
for _ in range(CYC):
    a, b, c_ = t0, t0 + INH, t0 + INH + EXH
    expr = f"if(between(t,{a},{b}),{R0}+{R1 - R0}*{ease(a, b)},if(between(t,{b},{c_}),{R1}-{R1 - R0}*{ease(b, c_)},{expr}))"
    ins.append(f"between(t,{a + 0.1},{b - 0.15})")
    outs.append(f"between(t,{b + 0.1},{c_ - 0.15})")
    clips += [(voice("bin"), a + 0.1), (voice("bout"), b + 0.1)]
    t0 = c_
scale = f"{S1}*({expr})/{R1}"
vf = (f"[1]format=rgba,scale=w='{scale}':h='{scale}':eval=frame,{afade(blen, 1.0, 0.8)}[o];"
      f"[0][o]overlay=x='(W-w)/2':y='(H-h)/2':eval=frame[b1];"
      f"[2]format=rgba,fade=in:st={intro}:d=0.5:alpha=1[li];[3]format=rgba[lo];"
      f"[b1][li]overlay=0:0:enable='{'+'.join(ins)}'[b2];"
      f"[b2][lo]overlay=0:0:enable='{'+'.join(outs)}',format=yuv420p[vo]")
encode([*bg_in(), "-loop", "1", "-framerate", str(FPS), "-i", f"{T}/orb.png",
        "-loop", "1", "-framerate", str(FPS), "-i", f"{T}/lin.png",
        "-loop", "1", "-framerate", str(FPS), "-i", f"{T}/lout.png"], vf, clips, blen, "breath")

# Luz que cruza las fotos fijas: banda diagonal cálida y difusa
lk = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(lk).polygon([(W * 0.35, 0), (W * 0.65, 0), (W * 0.45, H), (W * 0.15, H)], fill=(255, 236, 214, 60))
lk.filter(ImageFilter.GaussianBlur(90)).save(f"{T}/leak.png")

# 4 · Imágenes: la foto aparece sobre el fondo, con el texto en vidrio esmerilado
for i, sc in enumerate(X["scenes"]):
    text = L["affirmations"][i]
    x0, y0, x1, y1 = scene_parts(i, text)
    pw, ph = x1 - x0, y1 - y0
    da = dur(voice(f"a{i}"))
    length = 0.9 + da + max(3.0, da + 1.0)
    if sc.get("video"):
        # Clip animado: se ajusta a vertical y, si se queda corto, congela el último cuadro.
        src = ["-i", sc["video"]]
        base = (f"[1]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},"
                f"tpad=stop_mode=clone:stop_duration=6,trim=0:{length:.2f},setpts=PTS-STARTPTS")
    else:
        # Foto fija: entra desenfocada y se enfoca, y una luz suave la cruza una vez.
        Image.open(sc["image"]).convert("RGB").resize((W, H), Image.LANCZOS).save(f"{T}/scene{i}.jpg", quality=94)
        src = ["-loop", "1", "-framerate", str(FPS), "-i", f"{T}/scene{i}.jpg"]
        base = (f"[1]fps={FPS},split[s1][s2];[s2]gblur=sigma=18,format=rgba,fade=out:st=0.3:d=1.4:alpha=1[s3];"
                f"[s1][s3]overlay=0:0,format=rgba[s4];"
                f"[4]format=rgba[lk];[s4][lk]overlay=x='-{W}+({2 * W})*min(1,max(0,(t-1.2)/{max(2.0, length - 2.5):.2f}))':y=0")
    vf = (f"{base},split[za][zb];"
          f"[zb]crop={pw}:{ph}:{x0}:{y0},gblur=sigma=26,eq=brightness=0.05:saturation=1.15,format=rgba[bl];"
          f"[2]format=gray,fps={FPS}[m];[bl][m]alphamerge,fade=in:st=0.5:d=0.7:alpha=1[blm];"
          f"[za]format=rgba[zr];[zr][blm]overlay={x0}:{y0}[c];"
          f"[3]format=rgba,fps={FPS},fade=in:st=0.5:d=0.7:alpha=1[ov];[c][ov]overlay=0:0,"
          f"fade=in:st=0:d=0.9:alpha=1,fade=out:st={length - 0.9:.2f}:d=0.8:alpha=1[sc];"
          f"[0][sc]overlay=0:0:shortest=1,format=yuv420p[vo]")
    encode([*bg_in(), *src,
            "-loop", "1", "-framerate", str(FPS), "-i", f"{T}/mask{i}.png",
            "-loop", "1", "-framerate", str(FPS), "-i", f"{T}/ov{i}.png",
            "-loop", "1", "-framerate", str(FPS), "-i", f"{T}/leak.png"], vf,
           [(voice(f"a{i}"), 0.9)], length, f"scene{i}")

# 5 · Repite conmigo ×3, ágil
dc, dr = dur(voice("close")), dur(voice("ram"))
for k in range(3):
    close_png(f"{T}/close{k}.png", k)
    clips = [(voice("ram"), 0.8)] if k == 0 else []
    st = 0.8 + dr + 0.4 if k == 0 else 0.2
    ln = st + dc + dc * 0.8 + 0.4
    card(f"{T}/close{k}.png", ln, clips + [(voice("close"), st)], f"close{k}",
         fin=0.6 if k == 0 else 0.25, fout=0.25 if k < 2 else 0.6)

# 6 · Cierre
text_png(f"{T}/seal.png", L["seal"])
card(f"{T}/seal.png", 0.8 + dur(voice("seal")) + 1.4, [(voice("seal"), 0.8)], "seal")
logo_png(f"{T}/endlogo.png", sub=L["tomorrow"])
card(f"{T}/endlogo.png", 4.8, name="end", fin=1.0, fout=1.2)

# ── Unir + música con la voz por delante ───────────────────────────────────
with open(f"{T}/list.txt", "w") as fh:
    fh.writelines(f"file '{os.path.abspath(s)}'\n" for s in segs)
subprocess.run([FF, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", f"{T}/list.txt", "-c", "copy", f"{T}/joined.mp4"], check=True)
total = dur(f"{T}/joined.mp4")
subprocess.run([sys.executable, os.path.join(HERE, "music.py"), f"{total + 1:.2f}", f"{T}/music.wav"], check=True)
subprocess.run([FF, "-y", "-loglevel", "error", "-i", f"{T}/joined.mp4", "-i", f"{T}/music.wav", "-filter_complex",
                "[0:a]aresample=44100,aformat=channel_layouts=stereo,asplit=2[v1][v2];"
                "[1:a]volume=0.30[m];"
                "[m][v1]sidechaincompress=threshold=0.015:ratio=5:attack=40:release=900[md];"
                f"[v2][md]amix=inputs=2:normalize=0:duration=first,afade=out:st={total - 3:.2f}:d=3[ao]",
                "-map", "0:v", "-map", "[ao]", "-c:v", "libx264", "-crf", str(JOB.get("crf", 27)), "-preset", "slow",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT], check=True)
print(json.dumps({"ok": True, "segments": len(segs), "durationSec": round(dur(OUT), 1)}))
