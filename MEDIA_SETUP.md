# Creai Media Architecture - Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CreaidevStudio (Next.js)                  │
│                  VideoSOS Fork - Editor UI                   │
│         Timeline, Crop, Overlays, Export Controls            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP API Calls
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              Creai Media Backend (FastAPI)                   │
│          Thin orchestration layer for AI services            │
├──────────────────────────────────────────────────────────────┤
│  /scene-image      → FLUX.2-dev (HuggingFace)               │
│  /talking-head     → memo service                            │
│  /avatar-fullbody  → creaiVideo-Avatar service               │
│  /tts              → TTS service (to be configured)          │
│  /animate-image    → SVD/FAL (to be configured)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        │                     │               │
┌───────▼──────┐   ┌─────────▼─────┐   ┌────▼─────────┐
│   memo       │   │ creaiVideo-   │   │  FLUX.2-dev  │
│   (fork)     │   │   Avatar      │   │ (HuggingFace)│
│              │   │   (fork)      │   │              │
│ Talking-head │   │  Full-body    │   │ Scene & char │
│  close-up    │   │   avatar      │   │   images     │
└──────────────┘   └───────────────┘   └──────────────┘
```

## Repository Roles

### ActivateLLC/CreaidevStudio (This Repo)
- **Role**: Video editor UI (VideoSOS fork)
- **Features**: Timeline editing, crop, overlays, export, media management
- **Technology**: Next.js, React, TypeScript
- **Integration**: Calls creai-media-backend for AI generation

### ActivateLLC/memo
- **Role**: Talking-head avatar (close-up face/upper-body)
- **Features**: Animate face from single image + audio
- **Technology**: Python, PyTorch
- **Needs**: HTTP wrapper to expose as service

### ActivateLLC/creaiVideo-Avatar
- **Role**: Full-body & upper-body avatar (HunyuanVideo-Avatar)
- **Features**: Animate full character from image + audio
- **Technology**: Python, PyTorch, HunyuanVideo
- **Needs**: HTTP wrapper to expose as service

### FLUX.2-dev (HuggingFace + fal)
- **Role**: Text→image generation + image editing
- **Features**: Generate scenes, character shots, backgrounds
- **Integration**: Via HuggingFace Inference API

## Quick Start

### 1. Setup Media Backend

```bash
cd /workspaces/CreaidevStudio/creai-media-backend

# Copy environment config
cp .env.example .env

# Edit .env and add your HuggingFace token
# HF_TOKEN=hf_xxxxxxxxxxxxx

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
# Server runs at http://localhost:8000
```

### 2. Setup CreaidevStudio Frontend

```bash
cd /workspaces/CreaidevStudio

# Install dependencies
npm install

# Add environment variable
echo "NEXT_PUBLIC_MEDIA_BACKEND_URL=http://localhost:8000" >> .env.local

# Run the development server
npm run dev
# App runs at http://localhost:3000
```

### 3. Using the Media Generator in UI

The `MediaGenerator` component has been added to your project. To use it:

```tsx
import { MediaGenerator } from "@/components/media-generator";

function YourComponent() {
  const handleMediaGenerated = (url: string, type: "image" | "video" | "audio") => {
    console.log(`Generated ${type} at ${url}`);
    // Add to timeline, gallery, etc.
  };

  return (
    <MediaGenerator onMediaGenerated={handleMediaGenerated} />
  );
}
```

The component provides tabs for:
- **Scene Generation**: Text→image using FLUX.2-dev
- **Talking Head**: Image + audio → talking-head video (memo)
- **Full Avatar**: Image + audio → full-body video (HunyuanVideo-Avatar)
- **TTS**: Text → audio (placeholder, needs service)

## Docker Deployment

```bash
# Start all services
docker-compose up -d

# Services:
# - CreaidevStudio UI: http://localhost:3000
# - Media Backend API: http://localhost:8000
# - Media Backend Docs: http://localhost:8000/docs
```

## Next Steps

### Priority 1: Containerize memo fork

1. Clone your memo fork:
   ```bash
   cd /path/to/your/repos
   git clone https://github.com/ActivateLLC/memo.git
   cd memo
   ```

2. Create a simple FastAPI wrapper (`server.py`):
   ```python
   from fastapi import FastAPI, File, UploadFile
   from memo import generate_video  # Import your memo code
   
   app = FastAPI()
   
   @app.post("/generate")
   async def generate(image_url: str, audio_url: str):
       # Download image & audio
       # Call memo's generation
       # Return video file
       pass
   ```

3. Create `Dockerfile`:
   ```dockerfile
   FROM python:3.10
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
   ```

4. Uncomment memo service in `docker-compose.yml`

### Priority 2: Containerize creaiVideo-Avatar fork

Similar process to memo:

1. Clone your creaiVideo-Avatar fork
2. Add FastAPI wrapper with `/generate` endpoint
3. Create Dockerfile
4. Uncomment avatar service in `docker-compose.yml`

### Priority 3: Choose and integrate TTS

Options:
- **ElevenLabs**: Premium quality, paid
- **PlayHT**: Good quality, affordable
- **OpenAI TTS**: Simple, good quality
- **Coqui TTS**: Open-source, self-hosted

Update `creai-media-backend/main.py` in the `/tts` endpoint.

### Priority 4: Add image-to-video animation

Options:
- **Stable Video Diffusion**: Open-source, self-hosted
- **FAL img2vid**: Cloud API, fast
- **Runway Gen-2**: Premium quality

Update `creai-media-backend/main.py` in the `/animate-image` endpoint.

## API Reference

### Media Backend Endpoints

All endpoints are documented at `http://localhost:8000/docs` (Swagger UI)

#### POST /scene-image
Generate scene using FLUX.2-dev

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "width": 1024,
  "height": 1024
}
```

**Response:**
```json
{
  "imageUrl": "/media/scene_abc123.png",
  "filename": "scene_abc123.png"
}
```

#### POST /talking-head
Generate talking-head video

**Request:**
```json
{
  "imageUrl": "/media/face.png",
  "audioUrl": "/media/audio.wav"
}
```

**Response:**
```json
{
  "videoUrl": "/media/talking_head_xyz789.mp4",
  "filename": "talking_head_xyz789.mp4"
}
```

#### POST /avatar-fullbody
Generate full-body avatar

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

## Environment Variables

### CreaidevStudio (.env.local)
```bash
NEXT_PUBLIC_MEDIA_BACKEND_URL=http://localhost:8000
```

### Media Backend (.env)
```bash
HF_TOKEN=hf_xxxxxxxxxxxxx
MEDIA_DIR=./media
MEMO_SERVICE_URL=http://memo:8001
AVATAR_SERVICE_URL=http://avatar:8002
```

## Troubleshooting

### Media Backend won't start
- Check that HF_TOKEN is set correctly
- Ensure port 8000 is not in use: `lsof -i :8000`

### FLUX.2-dev generation fails
- Verify HuggingFace token has access to FLUX.2-dev
- Check HuggingFace API status

### memo/avatar services unavailable
- These services need to be containerized first
- Endpoints will return 503 until services are running

## File Structure

```
CreaidevStudio/
├── creai-media-backend/       # FastAPI backend
│   ├── main.py               # API server
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Container config
│   └── README.md             # Backend docs
├── src/
│   ├── lib/
│   │   └── media-backend.ts  # Client API functions
│   └── components/
│       └── media-generator.tsx  # UI component
├── docker-compose.yml        # Multi-service orchestration
└── MEDIA_SETUP.md           # This file
```

## Support

For issues specific to:
- **CreaidevStudio UI**: Open issue in ActivateLLC/CreaidevStudio
- **memo integration**: Open issue in ActivateLLC/memo
- **creaiVideo-Avatar**: Open issue in ActivateLLC/creaiVideo-Avatar
- **FLUX.2-dev**: Check HuggingFace model card

## License

Follow the licenses of each component:
- CreaidevStudio: [Your License]
- memo: [Check fork]
- creaiVideo-Avatar: [Check fork]
- FLUX.2-dev: black-forest-labs license
