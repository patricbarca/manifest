"""Secuencia de móvil (1080x1920, 30 fps): selfie -> escribe tu sueño -> generando -> vídeo tuyo.
Uso: python3 mock_phone.py <selfie.jpg> <bg.mp4> <escena.mp4> <salida.mp4> <dir_fuentes>
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps

SELFIE, BG, SCENE, OUT, FONTS = sys.argv[1:6]
W, H, FPS = 1080, 1920, 30
SX, SY, SW, SH, R = 296, 156, 488, 1028, 56          # pantalla
GOLD, BGC, CARD, WHITE, GREY = (255, 196, 92), (13, 18, 22), (27, 35, 42), (255, 255, 255), (150, 160, 168)
T1, T2, T3, T4 = 1.9, 2.5, 1.3, 2.6                    # selfie, sueño, generando, vídeo
DREAM = "I speak on the biggest stage in my city."
WORK = os.path.join(os.path.dirname(os.path.abspath(OUT)), "mock")
os.makedirs(f"{WORK}/scr", exist_ok=True)


def font(size, wght=600):
    f = ImageFont.truetype(f"{FONTS}/Inter.ttf", size)
    try:
        f.set_variation_by_axes([32, wght])
    except Exception:
        pass
    return f


def ff(*a):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)


def centered(d, y, text, f, fill):
    d.text(((SW - d.textlength(text, font=f)) / 2, y), text, font=f, fill=fill)


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


def base(title, step):
    im = Image.new("RGB", (SW, SH), BGC)
    d = ImageDraw.Draw(im)
    centered(d, 70, "ManifestLifeAI", font(24, 500), GREY)
    centered(d, 140, title, font(40, 700), WHITE)
    for i in range(3):  # puntos de progreso
        x = SW / 2 - 40 + i * 40
        d.ellipse([x - 7, 214, x + 7, 228], fill=GOLD if i <= step else (60, 70, 78))
    return im, d


selfie = ImageOps.fit(Image.open(SELFIE).convert("RGB"), (340, 400), centering=(0.5, 0.35))
mask = Image.new("L", selfie.size, 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, *selfie.size], radius=36, fill=255)
fr = 0


def save(im):
    global fr
    im.save(f"{WORK}/scr/{fr:04d}.png")
    fr += 1


# 1. Selfie (aparece y sale el check)
for i in range(int(T1 * FPS)):
    im, d = base("Add a selfie", 0)
    a = min(1, i / 12)
    ph = Image.blend(Image.new("RGB", selfie.size, BGC), selfie, a)
    im.paste(ph, ((SW - 340) // 2, 280), mask)
    if i > 22:
        d.ellipse([SW / 2 - 34, 720, SW / 2 + 34, 788], fill=GOLD)
        d.line([(SW / 2 - 15, 754), (SW / 2 - 3, 768), (SW / 2 + 17, 740)], fill=BGC, width=7)
        centered(d, 810, "Looks great", font(30, 600), WHITE)
    save(im)

# 2. Escribe tu sueño (se teclea)
n2 = int(T2 * FPS)
for i in range(n2):
    im, d = base("Write your dream", 1)
    d.rounded_rectangle([34, 290, SW - 34, 620], radius=28, fill=CARD, outline=GOLD, width=3)
    k = min(len(DREAM), int(len(DREAM) * i / (n2 * 0.75)))
    f = font(36, 500)
    lines = wrap(d, DREAM[:k] + ("|" if (i // 8) % 2 == 0 else ""), f, SW - 120)
    for j, ln in enumerate(lines):
        d.text((60, 320 + j * 50), ln, font=f, fill=WHITE)
    btn = GOLD if k == len(DREAM) else (70, 80, 88)
    d.rounded_rectangle([90, 700, SW - 90, 790], radius=45, fill=btn)
    centered(d, 726, "Create my video", font(32, 700), BGC)
    save(im)

# 3. Generando
n3 = int(T3 * FPS)
for i in range(n3):
    im, d = base("Creating your video…", 2)
    sm = selfie.resize((170, 200))
    m2 = mask.resize((170, 200))
    im.paste(sm, ((SW - 170) // 2, 330), m2)
    d.rounded_rectangle([64, 600, SW - 64, 616], radius=8, fill=(50, 60, 68))
    d.rounded_rectangle([64, 600, 64 + (SW - 128) * (i + 1) / n3, 616], radius=8, fill=GOLD)
    save(im)

# 4. El vídeo: la escena de él en el escenario llena la pantalla
n4 = int(T4 * FPS)
ff("-i", SCENE, "-t", f"{T4}", "-vf", f"fps={FPS},scale={SW}:{SH}:force_original_aspect_ratio=increase,crop={SW}:{SH}",
   f"{WORK}/scene_%04d.png")
for i in range(n4):
    p = f"{WORK}/scene_{min(i + 1, n4):04d}.png"
    im = Image.open(p).convert("RGB") if os.path.exists(p) else im
    d = ImageDraw.Draw(im)
    f = font(28, 650)
    t = "You, already there"
    tw = d.textlength(t, font=f)
    d.rounded_rectangle([(SW - tw) / 2 - 26, SH - 120, (SW + tw) / 2 + 26, SH - 64], radius=28, fill=(0, 0, 0))
    centered(d, SH - 108, t, f, GOLD)
    save(im.copy())

# Marco del móvil (borde negro con brillo sutil) y máscara redondeada de la pantalla
frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
fd = ImageDraw.Draw(frame)
fd.rounded_rectangle([SX - 18, SY - 18, SX + SW + 18, SY + SH + 18], radius=R + 18, fill=(8, 8, 10, 255), outline=(70, 74, 80, 255), width=3)
hole = Image.new("L", (W, H), 0)
ImageDraw.Draw(hole).rounded_rectangle([SX, SY, SX + SW, SY + SH], radius=R, fill=255)
frame.putalpha(Image.eval(frame.getchannel("A"), lambda v: v).point(lambda v: v))
fa = frame.getchannel("A")
fa.paste(0, mask=hole)
frame.putalpha(fa)
fd2 = ImageDraw.Draw(frame)
fd2.rounded_rectangle([SX + SW / 2 - 60, SY + 14, SX + SW / 2 + 60, SY + 46], radius=16, fill=(8, 8, 10, 255))  # isla
frame.save(f"{WORK}/frame.png")

total = fr / FPS
# Fondo: el dormitorio desenfocado y oscurecido; encima la pantalla y el marco, con un leve zoom de cámara.
ff("-stream_loop", "-1", "-i", BG, "-framerate", str(FPS), "-i", f"{WORK}/scr/%04d.png", "-i", f"{WORK}/frame.png",
   "-filter_complex",
   f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},boxblur=24:2,eq=brightness=-0.18[bg];"
   f"[bg][1:v]overlay={SX}:{SY}[a];[a][2:v]overlay=0:0,"
   f"scale=w='{W}*(1+0.04*t/{total:.2f})':h=-2:eval=frame,crop={W}:{H},format=yuv420p[v]",
   "-map", "[v]", "-t", f"{total:.2f}", "-c:v", "libx264", "-crf", "16", "-preset", "fast", OUT)
print("ok", OUT, round(total, 2))
