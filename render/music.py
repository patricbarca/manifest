"""Fondo musical de ManifestAI: pad etéreo + campanas suaves + reverberación.

Todo es síntesis propia, así que no hay licencias de por medio.
Uso: python3 music.py <segundos> <salida.wav>
"""
import sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
secs = float(sys.argv[1])
out = sys.argv[2]
n = int(SR * secs)
t = np.arange(n) / SR
rng = np.random.default_rng(7)


def hz(note):
    """Nota MIDI a Hz."""
    return 440.0 * 2 ** ((note - 69) / 12)


# Progresión lenta en La mayor, voces abiertas: Amaj9, F#m11, Dmaj9, E6/9.
CHORDS = [
    [45, 52, 56, 59, 64, 71],
    [42, 49, 54, 57, 61, 68],
    [38, 45, 50, 54, 57, 64],
    [40, 47, 52, 56, 59, 66],
]
CHORD_LEN = 14.0
XF = 5.0  # fundido entre acordes

pad = np.zeros(n)
k = 0
start = 0.0
while start < secs:
    chord = CHORDS[k % len(CHORDS)]
    s0 = int(max(0, start - XF / 2) * SR)
    s1 = int(min(secs, start + CHORD_LEN + XF / 2) * SR)
    seg_t = t[s0:s1]
    L = s1 - s0
    env = np.ones(L)
    ramp = int(XF * SR)
    env[: min(ramp, L)] = np.sin(np.linspace(0, np.pi / 2, min(ramp, L))) ** 2
    env[-min(ramp, L):] *= np.cos(np.linspace(0, np.pi / 2, min(ramp, L))) ** 2
    voice = np.zeros(L)
    for j, note in enumerate(chord):
        f = hz(note)
        amp = 1.0 / (1 + j * 0.35)
        # Tres osciladores ligeramente desafinados: da el "coro" que suena etéreo.
        for det in (-0.0018, 0.0, 0.0021):
            ph = rng.uniform(0, 2 * np.pi)
            lfo = 0.8 + 0.2 * np.sin(2 * np.pi * rng.uniform(0.03, 0.08) * seg_t + ph)
            voice += amp * lfo * (np.sin(2 * np.pi * f * (1 + det) * seg_t + ph)
                                  + 0.18 * np.sin(2 * np.pi * 2 * f * (1 + det) * seg_t + ph))
    pad[s0:s1] += voice * env
    start += CHORD_LEN
    k += 1

# Brillo alto muy suave (una octava arriba, filtrado)
shimmer = np.zeros(n)
for note in (76, 81, 83):
    shimmer += np.sin(2 * np.pi * hz(note) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.021 * t + note))
pad += 0.06 * shimmer

# Campanas en pentatónica de La, espaciadas y con caída larga.
bells = np.zeros(n)
PENTA = [69, 71, 73, 76, 78, 81, 83, 85]
tb = rng.uniform(6, 9)
while tb < secs - 6:
    f = hz(rng.choice(PENTA))
    s0 = int(tb * SR)
    L = min(int(6 * SR), n - s0)
    tt = np.arange(L) / SR
    env = np.exp(-tt / 1.6) * (1 - np.exp(-tt / 0.004))
    tone = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2.76 * f * tt) * np.exp(-tt / 0.5)
    bells[s0:s0 + L] += 0.22 * env * tone
    tb += rng.uniform(5.5, 10.0)

mix = pad / np.max(np.abs(pad)) * 0.6 + bells

# Reverberación: convolución con una cola de ruido que decae (~6 s).
ir_len = int(6.0 * SR)
ir_t = np.arange(ir_len) / SR
ir = rng.standard_normal(ir_len) * np.exp(-ir_t / 1.7)
ir = sosfilt(butter(2, 5000, "low", fs=SR, output="sos"), ir)
ir /= np.sqrt(np.sum(ir ** 2))
wet = fftconvolve(mix, ir)[:n]
mix = 0.55 * mix + 0.8 * wet

# Filtro final: quita graves que retumban y agudos que distraen de la voz.
mix = sosfilt(butter(2, [70, 6500], "band", fs=SR, output="sos"), mix)

# Entrada y salida suaves
fade = int(5 * SR)
mix[:fade] *= np.linspace(0, 1, fade) ** 2
mix[-fade:] *= np.linspace(1, 0, fade) ** 2

mix = mix / np.max(np.abs(mix)) * 0.89
stereo = np.stack([mix, np.roll(mix, int(0.012 * SR))], axis=1)  # algo de anchura
wavfile.write(out, SR, (stereo * 32767).astype(np.int16))
print("ok", round(secs, 1), "s")
