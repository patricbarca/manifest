# fal.ai recipes for promo videos

Endpoints used successfully in this project (confirm with `get_model_schema` before calling; prices change — use `get_pricing` when giving the user an estimate):

| Step | Endpoint | Notes |
|---|---|---|
| Scene with the person's face | `fal-ai/bytedance/seedream/v4.5/edit` | Pass 1–4 reference photos in `image_urls`. Ask for 9:16 (e.g. 1080x1920 or the model's closest size). |
| Scene without a person / background | `fal-ai/bytedance/seedream/v4.5/text-to-image` | Logo backgrounds, places, objects. |
| Animate a still | `minimax/h3-max/image-to-video` | 768p, ~6 s; about $0.0325 per second at 768p when last checked. `end_image_url` makes the clip land on a target frame (good for "phone screen → stepping into the scene"). |
| Voiceover | `elevenlabs/tts/eleven-v4` | Voices that worked: **Sarah** (calm narrator), **George** (brand ending), Matilda/Alice (female alternatives), Brian (male). One line per call. |
| Upscale (only if needed for 4K frames) | `fal-ai/seedvr/upscale/image` | Usually unnecessary for social. |

## Prompt pattern for scenes

"Vertical 9:16 cinematic photo of the same person from the reference images, <action in their desired life>, <place>, golden hour light, natural skin, candid, shallow depth of field, no text, no logos."

- Always "no text": models misspell words (a marathon arch came out as "FINSH"). Add any words later with ffmpeg overlays.
- Keep identity: reuse the same reference photos for every scene; describe hair/beard if it drifts.
- POV shots (first person, no face) don't need the reference photo.

## Running jobs

- Several scenes → `submit_jobs` once, then `wait_for_jobs`. If a job returns `submission_unknown`, check `search_request_history` before resubmitting (avoid paying twice).
- Download outputs to the scratchpad, never into the repo (faces).
- Report the real cost back to the user at the end.
