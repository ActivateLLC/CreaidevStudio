# Integration Guide: Real Repo Structure

## The Actual Repos

### ActivateLLC/memo
- **What it is**: Fork of memoavatar/memo
- **Structure**: Python project with `inference.py`
- **Usage**: `python inference.py --input_image path/to/image.png --input_audio path/to/audio.wav --output_dir ./output`
- **Weights**: Downloaded from HuggingFace
- **Purpose**: Talking-head avatar (close-up face/upper-body)

### ActivateLLC/creaiVideo-Avatar
- **What it is**: Fork of Tencent-Hunyuan/HunyuanVideo-Avatar
- **Structure**: Full Python inference code + Gradio server script
- **Usage**: Has internal inference functions OR run Gradio app
- **Weights**: Hunyuan models from HuggingFace/Tencent
- **Purpose**: Full-body avatar generation

### ActivateLLC/CreaidevStudio
- **What it is**: Fork of timoncool/videosos
- **Structure**: Next.js + Remotion browser editor
- **Current integrations**: fal.ai and Runware.ai (HTTP endpoints in `src/` config/util files)
- **Purpose**: Video editor UI (timeline, crop, overlays, export)

---

## Integration Pattern

### 1. Media Backend (This Service)

**Location**: `/workspaces/CreaidevStudio/creai-media-backend/`

**Setup**:
```bash
cd creai-media-backend

# Add repos as git submodules
git submodule add https://github.com/ActivateLLC/memo.git
git submodule add https://github.com/ActivateLLC/creaiVideo-Avatar.git

# Initialize and update submodules
git submodule update --init --recursive

# Install dependencies for each
cd memo
pip install -r requirements.txt
# Follow memo README to download weights
cd ..

cd creaiVideo-Avatar
pip install -r requirements.txt
# Follow their README to download Hunyuan weights
cd ..

# Install backend dependencies
pip install -r requirements.txt
```

**Integration in `main.py`**:

```python
import sys
from pathlib import Path

# Add submodule paths
sys.path.insert(0, str(Path("./memo")))
sys.path.insert(0, str(Path("./creaiVideo-Avatar")))

# Import memo functions
from memo.inference import main as memo_inference
# OR import whatever function memo exposes

# Import avatar functions
# from inference import generate_video as avatar_inference
# OR use their Gradio functions

@app.post("/talking-head")
async def generate_talking_head(req: TalkingHeadRequest):
    # Download image & audio from URLs
    # Save to temp files
    # Call: memo_inference(image_path, audio_path, output_dir)
    # Return the generated video URL
    pass

@app.post("/avatar-fullbody")
async def generate_fullbody_avatar(req: AvatarRequest):
    # Download image & audio from URLs
    # Save to temp files
    # Call: avatar_inference(image_path, audio_path, output_path, style)
    # Return the generated video URL
    pass
```

### 2. CreaidevStudio (Next.js Frontend)

**Location**: `/workspaces/CreaidevStudio/`

**Current structure**: Already has client code for fal.ai and Runware in `src/lib/` files.

**Swap clients**: Replace fal/Runware calls with calls to your media backend:

```typescript
// src/lib/media-backend.ts (already created)
const MEDIA_BACKEND_URL = "http://localhost:8000";

export async function generateSceneImage(prompt: string) {
  const response = await fetch(`${MEDIA_BACKEND_URL}/scene-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}

export async function generateTalkingHead(imageUrl: string, audioUrl: string) {
  const response = await fetch(`${MEDIA_BACKEND_URL}/talking-head`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, audioUrl }),
  });
  return response.json();
}

// etc.
```

**Use in components**: CreaidevStudio treats responses as media URLs for the timeline.

---

## Step-by-Step Setup

### Step 1: Add Submodules

```bash
cd /workspaces/CreaidevStudio/creai-media-backend

# Add memo
git submodule add https://github.com/ActivateLLC/memo.git

# Add creaiVideo-Avatar
git submodule add https://github.com/ActivateLLC/creaiVideo-Avatar.git

# Initialize
git submodule update --init --recursive
```

### Step 2: Install Dependencies

```bash
# memo dependencies
cd memo
pip install -r requirements.txt
# Download memo weights from HF (check their README)
cd ..

# avatar dependencies
cd creaiVideo-Avatar
pip install -r requirements.txt
# Download Hunyuan weights (check their README)
cd ..

# Backend dependencies
pip install -r requirements.txt
```

### Step 3: Update main.py Imports

Check the actual function names in each repo:

```bash
# Look at memo's inference.py
cat memo/inference.py | grep "def "

# Look at creaiVideo-Avatar's inference code
cat creaiVideo-Avatar/*.py | grep "def "
```

Then update `main.py` to import and call those functions.

### Step 4: Test Endpoints

```bash
# Start backend
python main.py

# Test FLUX.2-dev (should work immediately with HF token)
curl -X POST http://localhost:8000/scene-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset"}'

# Test memo (once integrated)
curl -X POST http://localhost:8000/talking-head \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "http://example.com/face.png", "audioUrl": "http://example.com/audio.wav"}'
```

### Step 5: Connect Frontend

```bash
cd /workspaces/CreaidevStudio

# Ensure .env.local has backend URL
echo "NEXT_PUBLIC_MEDIA_BACKEND_URL=http://localhost:8000" >> .env.local

# Run frontend
npm run dev

# Open http://localhost:3000
# Use "Generate Media" button to test
```

---

## Code Integration Examples

### memo Integration

Check `memo/inference.py` - it likely has something like:

```python
def main(args):
    # Load models
    # Process image & audio
    # Generate video
    # Save to output_dir
```

Wrap it in your endpoint:

```python
@app.post("/talking-head")
async def generate_talking_head(req: TalkingHeadRequest):
    # Download inputs
    image_path = save_temp_file(download(req.imageUrl), "image.png")
    audio_path = save_temp_file(download(req.audioUrl), "audio.wav")
    output_dir = f"./media/talking_head_{uuid.uuid4()}"
    
    # Call memo
    import argparse
    args = argparse.Namespace(
        input_image=image_path,
        input_audio=audio_path,
        output_dir=output_dir,
        # ... other memo args
    )
    
    from memo.inference import main as memo_main
    memo_main(args)
    
    # Find output video
    video_path = Path(output_dir) / "output.mp4"  # check actual filename
    
    return {"videoUrl": f"/media/{video_path.name}", "filename": video_path.name}
```

### creaiVideo-Avatar Integration

Check if they have a Gradio `app.py` or inference functions. Example:

```python
@app.post("/avatar-fullbody")
async def generate_fullbody_avatar(req: AvatarRequest):
    # Download inputs
    image_path = save_temp_file(download(req.imageUrl), "image.png")
    audio_path = save_temp_file(download(req.audioUrl), "audio.wav")
    output_path = f"./media/avatar_{uuid.uuid4()}.mp4"
    
    # Call their inference
    # from inference import generate_avatar
    # generate_avatar(image_path, audio_path, output_path, style=req.style)
    
    return {"videoUrl": f"/media/{Path(output_path).name}", "filename": Path(output_path).name}
```

---

## Docker Setup

Update the Dockerfile to include submodules:

```dockerfile
FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y git ffmpeg

# Copy everything including submodules
COPY . .

# Install all dependencies
RUN pip install -r requirements.txt
RUN cd memo && pip install -r requirements.txt && cd ..
RUN cd creaiVideo-Avatar && pip install -r requirements.txt && cd ..

# Download model weights (or mount as volume)
# RUN python download_weights.py

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Update docker-compose:

```yaml
services:
  media-backend:
    build:
      context: ./creai-media-backend
    volumes:
      - ./creai-media-backend:/app
      - model-cache:/root/.cache  # Cache HF models
    environment:
      - HF_TOKEN=${HF_TOKEN}
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

## Gotchas & Solutions

### 1. GPU Access
- **Issue**: Models need CUDA
- **Solution**: Use `nvidia-docker` runtime, ensure CUDA is available in container

### 2. Model Weights
- **Issue**: Large model files (GBs)
- **Solution**: 
  - Download once, mount as volume
  - Use HuggingFace cache directory
  - Or use model hosting services

### 3. CORS
- **Issue**: Frontend can't call backend
- **Solution**: Already handled in `main.py` with CORSMiddleware

### 4. Long Generation Times
- **Issue**: Video generation takes minutes
- **Solution**:
  - Use background tasks (Celery + Redis)
  - Return task ID immediately
  - Poll for completion
  - Or use WebSocket for progress updates

### 5. Environment Setup
- **Issue**: Different Python versions, CUDA versions
- **Solution**: Use Docker with pinned base images

---

## Testing Checklist

- [ ] FLUX.2-dev endpoint works (add HF_TOKEN)
- [ ] memo submodule added and dependencies installed
- [ ] memo weights downloaded
- [ ] memo endpoint returns video
- [ ] creaiVideo-Avatar submodule added
- [ ] Hunyuan weights downloaded
- [ ] avatar endpoint returns video
- [ ] Frontend can call all endpoints
- [ ] Videos appear in CreaidevStudio timeline
- [ ] GPU is being used (check with `nvidia-smi` during generation)

---

## Directory Structure

```
CreaidevStudio/
├── creai-media-backend/           # This service
│   ├── main.py                    # FastAPI server
│   ├── requirements.txt           # Backend deps
│   ├── memo/                      # Git submodule
│   │   ├── inference.py           # Call this
│   │   ├── requirements.txt       # Install this
│   │   └── ...
│   └── creaiVideo-Avatar/         # Git submodule
│       ├── inference.py (or similar)
│       ├── requirements.txt
│       └── ...
├── src/                           # Next.js frontend
│   ├── lib/
│   │   └── media-backend.ts       # Calls backend
│   └── components/
│       └── media-generator.tsx    # UI
└── docker-compose.yml             # Orchestration
```

---

## Summary

**The key insight**: 
- CreaidevStudio (Next.js) = **pure frontend** that calls HTTP APIs
- Media backend (FastAPI) = **unified Python service** that imports memo & creaiVideo-Avatar as submodules
- No separate services for memo/avatar - just import and call their functions directly
- Swap fal.ai/Runware calls in frontend with your backend calls

This is simpler than running multiple services!
