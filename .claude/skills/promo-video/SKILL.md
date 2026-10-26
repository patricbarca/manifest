---
name: promo-video
description: Produce ManifestLifeAI promotional and demo videos (vertical 1080x1920) — long-form promo with narration, TikTok/Reels/Shorts cuts with a POV hook, or public demo fragments for the website and market. Generates scenes with fal.ai (reference face → scene image → animation, ElevenLabs voice) and edits with ffmpeg via the bundled build script, ending on the brand card "ManifestLifeAI. See it. Feel it. Live it." Use this whenever the user asks for a promo, ad, TikTok, Reel, teaser, demo clip, example video for the landing or market, or "another video like the last one", even if they don't say "promo".
---

# ManifestLifeAI promo videos

Videos that sell the feeling of the product: a person sees themselves living their desired life. The recipe below is what already worked (the user approved the promo with George's ending and the TikTok POV cut), so reuse it instead of reinventing.

## Before spending money

Every generation costs real money (images ~cents, animation ~$0.03/s at 768p, voice per character). Before generating:

1. Write a short plan: format (promo / tiktok / demo fragment), language, voice, the 4–7 scenes, the voiceover lines, and an **estimated cost**.
2. Ask the user to approve it. Reuse existing assets (clips, voices, logo, background) whenever they fit — that's free.
3. If a job fails or a model returns something odd, report it; don't silently resubmit or change models.

## Rules that protect the business and people

- **Face photos are biometric data.** Keep them in the scratchpad only; never commit them, never put them in `public/` unless the person is AI-generated (the demo personas are).
- **Public demos show only a fragment**: the manifestation scenes, ONE affirmation ("I am living this life now. It is already mine.") and the close ("Thank you. It is done."). Never publish the full product video (breathing, opening quote, all affirmations) — competitors would copy it.
- **No promises of results** (money, health, guaranteed manifestation). Frame it as visualization, focus and motivation. This is also what ad platforms and consumer law require.
- Copy must not promise features that don't exist (watermark, creator payouts, lengths) — check the app first.

## Formats

| Format | Use | Style in `build_video.py` |
|---|---|---|
| Promo (30–45 s) | Landing hero, YouTube | `promo`: crossfades, serif captions at the bottom, brand end card with CTA button |
| TikTok/Reels (25–30 s) | Social, ads | `tiktok`: hard cuts every 2–3 s, "POV:" hook on top for the first shot, short punchy captions with outline, end card "Make yours. / Link in bio ↓" |
| Demo fragment (15–25 s) | Website examples, market cards | `promo` without end card, or just scenes + one affirmation + close |

Narration patterns that worked:
- **Promo** (3rd person, calm, Sarah): open with a Dispenza-style idea without naming him ("Your brain can't tell the difference between what you vividly imagine… and what you live."), show the ritual on the phone, step into the reality, close.
- **TikTok** (1st person, her own voice): hook in the first 2 s, then "I wrote down 3 desires… and uploaded one selfie" → "it made me a video of ME living them" → "every night: I breathe, I watch, I repeat" → "my brain started believing it…".
- **Ending**: a different voice (George) says "ManifestLifeAI. See it. Feel it. Live it." over the brand card.

## Workflow

1. **Plan + cost → user approval** (see above).
2. **Scenes**: generate each still with the reference face (image-edit model, e.g. Seedream 4.5 edit), 9:16. See `references/fal-recipes.md` for prompts, models and pitfalls (text in images comes out misspelled — avoid signs/arches with words).
3. **Animate** each still (image-to-video, e.g. MiniMax at 768p, 6 s). Use `end_image_url` when a shot must land on a specific frame (phone → reality transition).
4. **Voice**: one mp3 per line (ElevenLabs eleven-v4). Measure each with ffmpeg to place lines without overlap.
5. **Edit**: write a spec JSON and run the bundled script (no AI cost):
   ```bash
   FFMPEG_PATH=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2 \
   python3 .claude/skills/promo-video/scripts/build_video.py spec.json
   ```
   The spec format is documented at the top of `scripts/build_video.py`. Music is synthesized by `render/music.py` (no licensing) and ducks under the voice.
6. **Check**: extract 3–4 frames into one contact sheet and look at it once (captions readable, no cut faces, end card centered). Don't screenshot every page.
7. **Deliver**: send the MP4 to the user. Only copy to `public/videos/` (website) after they approve, and only fragments.

## Editing pitfalls (already solved in the script — keep them if you edit it)

- `xfade` needs constant frame rate and equal SAR: normalize every input with `settb=AVTB,setpts=PTS-STARTPTS,fps=30,setsar=1` (fps **after** setpts).
- Join hard cuts with the `concat` *filter*, not the concat demuxer (wrong durations).
- A PNG overlay without `-loop 1` lasts one frame.
- Inter's variation axes are `[opsz, wght]`; Cormorant's is `[wght]`.
- Short clips are padded with `tpad=stop_mode=clone` so a shot never goes black.
