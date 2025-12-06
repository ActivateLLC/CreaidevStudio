# Templates for Containerizing memo and creaiVideo-Avatar

## Template for memo Service Wrapper

### File: memo/server.py

```python
"""
FastAPI wrapper for memo (talking-head generation)
Exposes memo functionality as HTTP service for creai-media-backend
"""

import os
import uuid
from pathlib import Path
from typing import Optional
import requests
from io import BytesIO

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import torch

# Import your memo code here
# from memo.inference import generate_talking_head

app = FastAPI(title="Memo Talking-Head Service")

TEMP_DIR = Path("./temp")
TEMP_DIR.mkdir(exist_ok=True)

class GenerateRequest(BaseModel):
    image_url: str
    audio_url: str
    duration: Optional[float] = None

def download_file(url: str) -> bytes:
    """Download file from URL"""
    response = requests.get(url)
    response.raise_for_status()
    return response.content

@app.get("/")
def root():
    return {"service": "memo", "status": "ready"}

@app.get("/health")
def health():
    return {"status": "healthy", "gpu_available": torch.cuda.is_available()}

@app.post("/generate")
async def generate(req: GenerateRequest):
    """
    Generate talking-head video from image and audio
    """
    try:
        # Download inputs
        image_data = download_file(req.image_url)
        audio_data = download_file(req.audio_url)
        
        # Save to temp files
        image_path = TEMP_DIR / f"input_{uuid.uuid4()}.png"
        audio_path = TEMP_DIR / f"input_{uuid.uuid4()}.wav"
        output_path = TEMP_DIR / f"output_{uuid.uuid4()}.mp4"
        
        with open(image_path, "wb") as f:
            f.write(image_data)
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        
        # Call your memo inference code
        # generate_talking_head(
        #     image_path=str(image_path),
        #     audio_path=str(audio_path),
        #     output_path=str(output_path),
        #     duration=req.duration
        # )
        
        # For now, return a placeholder response
        raise HTTPException(
            status_code=501,
            detail="Memo inference not yet implemented. Add your memo generation code here."
        )
        
        # When implemented, return the video file
        # return FileResponse(
        #     output_path,
        #     media_type="video/mp4",
        #     filename="talking_head.mp4"
        # )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp files
        for path in [image_path, audio_path]:
            if path.exists():
                path.unlink()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

### File: memo/Dockerfile

```dockerfile
FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    git \\
    ffmpeg \\
    libsm6 \\
    libxext6 \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install FastAPI and dependencies
RUN pip install fastapi uvicorn[standard] python-multipart requests

# Copy application code
COPY . .

# Create temp directory
RUN mkdir -p /app/temp

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### File: memo/requirements.txt (add to existing)

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
requests==2.31.0
```

---

## Template for creaiVideo-Avatar Service Wrapper

### File: creaiVideo-Avatar/server.py

```python
"""
FastAPI wrapper for HunyuanVideo-Avatar (full-body avatar generation)
Exposes avatar functionality as HTTP service for creai-media-backend
"""

import os
import uuid
from pathlib import Path
from typing import Optional, Literal
import requests

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import torch

# Import your HunyuanVideo-Avatar code here
# from inference import generate_avatar_video

app = FastAPI(title="HunyuanVideo-Avatar Service")

TEMP_DIR = Path("./temp")
TEMP_DIR.mkdir(exist_ok=True)

class GenerateRequest(BaseModel):
    image_url: str
    audio_url: str
    style: Literal["full-body", "upper-body"] = "full-body"

def download_file(url: str) -> bytes:
    """Download file from URL"""
    response = requests.get(url)
    response.raise_for_status()
    return response.content

@app.get("/")
def root():
    return {"service": "HunyuanVideo-Avatar", "status": "ready"}

@app.get("/health")
def health():
    return {"status": "healthy", "gpu_available": torch.cuda.is_available()}

@app.post("/generate")
async def generate(req: GenerateRequest):
    """
    Generate full-body or upper-body avatar video from image and audio
    """
    try:
        # Download inputs
        image_data = download_file(req.image_url)
        audio_data = download_file(req.audio_url)
        
        # Save to temp files
        image_path = TEMP_DIR / f"input_{uuid.uuid4()}.png"
        audio_path = TEMP_DIR / f"input_{uuid.uuid4()}.wav"
        output_path = TEMP_DIR / f"output_{uuid.uuid4()}.mp4"
        
        with open(image_path, "wb") as f:
            f.write(image_data)
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        
        # Call your HunyuanVideo-Avatar inference code
        # generate_avatar_video(
        #     image_path=str(image_path),
        #     audio_path=str(audio_path),
        #     output_path=str(output_path),
        #     style=req.style
        # )
        
        # For now, return a placeholder response
        raise HTTPException(
            status_code=501,
            detail="HunyuanVideo-Avatar inference not yet implemented. Add your generation code here."
        )
        
        # When implemented, return the video file
        # return FileResponse(
        #     output_path,
        #     media_type="video/mp4",
        #     filename=f"avatar_{req.style}.mp4"
        # )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp files
        for path in [image_path, audio_path]:
            if path.exists():
                path.unlink()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
```

### File: creaiVideo-Avatar/Dockerfile

```dockerfile
FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    git \\
    ffmpeg \\
    libsm6 \\
    libxext6 \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install FastAPI and dependencies
RUN pip install fastapi uvicorn[standard] python-multipart requests

# Copy application code
COPY . .

# Create temp directory
RUN mkdir -p /app/temp

EXPOSE 8002

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8002"]
```

---

## Integration Checklist

### For memo (ActivateLLC/memo):

- [ ] Add `server.py` file with above template
- [ ] Add FastAPI dependencies to requirements.txt
- [ ] Create Dockerfile
- [ ] Import your memo inference code into `server.py`
- [ ] Replace placeholder in `/generate` endpoint with actual inference call
- [ ] Test locally: `python server.py` → http://localhost:8001/docs
- [ ] Update docker-compose.yml in CreaidevStudio (uncomment memo section)
- [ ] Test with CreaidevStudio frontend

### For creaiVideo-Avatar (ActivateLLC/creaiVideo-Avatar):

- [ ] Add `server.py` file with above template
- [ ] Add FastAPI dependencies to requirements.txt
- [ ] Create Dockerfile
- [ ] Import your HunyuanVideo inference code into `server.py`
- [ ] Replace placeholder in `/generate` endpoint with actual inference call
- [ ] Test locally: `python server.py` → http://localhost:8002/docs
- [ ] Update docker-compose.yml in CreaidevStudio (uncomment avatar section)
- [ ] Test with CreaidevStudio frontend

---

## Testing the Integration

### 1. Test memo service standalone:

```bash
cd /path/to/memo
python server.py
```

Visit http://localhost:8001/docs and test the `/generate` endpoint.

### 2. Test avatar service standalone:

```bash
cd /path/to/creaiVideo-Avatar
python server.py
```

Visit http://localhost:8002/docs and test the `/generate` endpoint.

### 3. Test with Docker Compose:

```bash
cd /path/to/CreaidevStudio

# Update docker-compose.yml to point to your repos
# Then start all services:
docker-compose up -d

# Check logs:
docker-compose logs -f memo
docker-compose logs -f avatar
```

### 4. Test end-to-end:

1. Open CreaidevStudio at http://localhost:3000
2. Click "Generate Media" button
3. Try generating a talking-head or avatar
4. Verify the video appears in your timeline/gallery

---

## Troubleshooting

### GPU not detected in Docker:
Install nvidia-docker and use GPU runtime:
```bash
docker run --gpus all ...
```

### Port conflicts:
Change ports in docker-compose.yml if 8001/8002 are in use.

### Model download issues:
Pre-download models before containerizing or mount a model cache volume.

---

## Production Considerations

1. **Model Caching**: Pre-download models into the container or use persistent volumes
2. **GPU Support**: Use nvidia-docker runtime for GPU acceleration
3. **Queue System**: Add Celery/RabbitMQ for handling long-running generation tasks
4. **Storage**: Upload generated media to S3 instead of local storage
5. **Monitoring**: Add Prometheus/Grafana for service health monitoring
6. **Rate Limiting**: Implement rate limiting on endpoints
7. **Authentication**: Add API keys or JWT tokens for security
