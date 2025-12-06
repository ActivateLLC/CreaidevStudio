# Creai Media Backend

**Unified Python service** that integrates all AI repos internally and exposes REST endpoints.

This is a **standalone backend** - CreaidevStudio (Next.js frontend) only calls these HTTP endpoints.

## Integrated Repos

- **FLUX.2-dev** (HuggingFace Inference API) - Text-to-image scene generation
- **ActivateLLC/memo** (submodule) - Talking-head with `inference.py --input_image --input_audio`
- **ActivateLLC/creaiVideo-Avatar** (submodule) - HunyuanVideo full-body avatar
- **TTS** (TODO) - Text-to-speech service to be chosen
- **Image Animation** (TODO) - Stable Video Diffusion or FAL img2vid

## Architecture

```
CreaidevStudio (Next.js)
    ↓ HTTP calls
Media Backend (FastAPI)
    ├─ FLUX.2-dev (HF API)
    ├─ memo (git submodule → inference.py)
    ├─ creaiVideo-Avatar (git submodule → inference code)
    ├─ TTS (future)
    └─ img2vid (future)
```

## Setup

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your HuggingFace token
```

3. Run the server:
```bash
python main.py
# or
uvicorn main:app --reload
```

Server runs on `http://localhost:8000`

### Docker

```bash
docker build -t creai-media-backend .
docker run -p 8000:8000 --env-file .env creai-media-backend
```

### With Docker Compose

See the main `docker-compose.yml` in the root directory.

## API Endpoints

### POST /scene-image
Generate scene image using FLUX.2-dev

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "width": 1024,
  "height": 1024,
  "num_inference_steps": 50,
  "guidance_scale": 7.5
}
```

**Response:**
```json
{
  "imageUrl": "/media/scene_abc123.png",
  "filename": "scene_abc123.png"
}
```

### POST /talking-head
Generate talking-head video from image + audio

**Request:**
```json
{
  "imageUrl": "/media/face.png",
  "audioUrl": "/media/audio.wav",
  "duration": 5.0
}
```

**Response:**
```json
{
  "videoUrl": "/media/talking_head_xyz789.mp4",
  "filename": "talking_head_xyz789.mp4"
}
```

### POST /avatar-fullbody
Generate full-body or upper-body avatar

**Request:**
```json
{
  "imageUrl": "/media/person.png",
  "audioUrl": "/media/speech.wav",
  "style": "full-body"
}
```

**Response:**
```json
{
  "videoUrl": "/media/avatar_full-body_def456.mp4",
  "filename": "avatar_full-body_def456.mp4"
}
```

### POST /tts (TODO)
Generate text-to-speech audio

### POST /animate-image (TODO)
Animate static image to video

## Integration with memo & creaiVideo-Avatar

The backend integrates these repos **directly as git submodules**:

### 1. Add memo as submodule

```bash
cd creai-media-backend
git submodule add https://github.com/ActivateLLC/memo.git
cd memo
pip install -r requirements.txt
# Download weights from HuggingFace as per memo README
```

Then in `main.py`, import and call:
```python
from memo.inference import run_inference  # or whatever the function is
# Call it with image_path, audio_path, output_dir
```

### 2. Add creaiVideo-Avatar as submodule

```bash
cd creai-media-backend
git submodule add https://github.com/ActivateLLC/creaiVideo-Avatar.git
cd creaiVideo-Avatar
pip install -r requirements.txt
# Download Hunyuan weights as per their README
```

Then in `main.py`, import and call their inference functions.

### No separate services needed!

Both repos are **imported directly** into the media backend Python process. No HTTP between services, just function calls.

## Next Steps

1. ✅ Basic FastAPI structure
2. ✅ FLUX.2-dev integration via HuggingFace
3. 🔄 Add memo as submodule and import `inference.py`
4. 🔄 Add creaiVideo-Avatar as submodule and import inference code
5. ⏳ Add TTS integration (ElevenLabs, PlayHT, or other)
6. ⏳ Add image-to-video animation (SVD or FAL)
7. ⏳ Add S3 upload for production storage

## Quick Integration

```bash
# Add repos as submodules
git submodule add https://github.com/ActivateLLC/memo.git
git submodule add https://github.com/ActivateLLC/creaiVideo-Avatar.git

# Install their dependencies
cd memo && pip install -r requirements.txt && cd ..
cd creaiVideo-Avatar && pip install -r requirements.txt && cd ..

# Download model weights (follow each repo's README)

# Update main.py to import and call their functions
```
