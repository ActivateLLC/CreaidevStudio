"""
Creai Media Backend - Unified AI media generation service
Integrates all AI repos internally:
- FLUX.2-dev (via HuggingFace Inference API)
- memo (ActivateLLC/memo) - talking-head generation
- creaiVideo-Avatar (ActivateLLC/creaiVideo-Avatar) - full-body avatars
- TTS (to be configured)
- Image animation (SVD/FAL, to be configured)

This is a standalone service that CreaidevStudio frontend calls via HTTP.
"""

import os
import sys
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from huggingface_hub import InferenceClient
import requests
from PIL import Image
import io

# Add paths for integrated repos
MEMO_PATH = Path(os.getenv("MEMO_PATH", "./memo"))
AVATAR_PATH = Path(os.getenv("AVATAR_PATH", "./creaiVideo-Avatar"))

# Add to Python path if repos are present as submodules
if MEMO_PATH.exists():
    sys.path.insert(0, str(MEMO_PATH))
if AVATAR_PATH.exists():
    sys.path.insert(0, str(AVATAR_PATH))

app = FastAPI(
    title="Creai Media Backend",
    description="AI-powered media generation API",
    version="1.0.0"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MEDIA_DIR = Path(os.getenv("MEDIA_DIR", "./media"))
MEDIA_DIR.mkdir(exist_ok=True)
HF_TOKEN = os.getenv("HF_TOKEN")

# Initialize FLUX.2-dev client
flux_client = InferenceClient("black-forest-labs/FLUX.2-dev", token=HF_TOKEN)

# Try to import integrated repos
try:
    # Import memo functions if available
    # from memo.inference import generate_talking_head_video
    MEMO_AVAILABLE = MEMO_PATH.exists()
except ImportError:
    MEMO_AVAILABLE = False
    print("⚠️  memo repo not found. /talking-head endpoint will not work.")

try:
    # Import creaiVideo-Avatar functions if available
    # from inference import generate_avatar_video
    AVATAR_AVAILABLE = AVATAR_PATH.exists()
except ImportError:
    AVATAR_AVAILABLE = False
    print("⚠️  creaiVideo-Avatar repo not found. /avatar-fullbody endpoint will not work.")


# Request/Response Models
class SceneImageRequest(BaseModel):
    prompt: str
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    num_inference_steps: Optional[int] = 50
    guidance_scale: Optional[float] = 7.5


class SceneImageResponse(BaseModel):
    imageUrl: str
    filename: str


class TalkingHeadRequest(BaseModel):
    imageUrl: str
    audioUrl: str
    duration: Optional[float] = None


class AvatarRequest(BaseModel):
    imageUrl: str
    audioUrl: str
    style: Optional[str] = "full-body"  # "full-body" or "upper-body"


class MediaResponse(BaseModel:
    videoUrl: str
    filename: str


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "default"
    speed: Optional[float] = 1.0


class TTSResponse(BaseModel):
    audioUrl: str
    filename: str


class AnimateImageRequest(BaseModel):
    imageUrl: str
    duration: Optional[float] = 3.0
    fps: Optional[int] = 24


# Utility functions
def save_image_and_get_url(img: Image.Image, prefix: str = "scene") -> tuple[str, str]:
    """Save image to disk and return URL and filename"""
    filename = f"{prefix}_{uuid.uuid4()}.png"
    filepath = MEDIA_DIR / filename
    img.save(filepath)
    # Return relative URL that frontend can access
    url = f"/media/{filename}"
    return url, filename


def save_file_and_get_url(content: bytes, prefix: str = "media", ext: str = "mp4") -> tuple[str, str]:
    """Save file to disk and return URL and filename"""
    filename = f"{prefix}_{uuid.uuid4()}.{ext}"
    filepath = MEDIA_DIR / filename
    with open(filepath, "wb") as f:
        f.write(content)
    url = f"/media/{filename}"
    return url, filename


# API Endpoints
@app.get("/")
def root():
    return {
        "service": "Creai Media Backend",
        "version": "1.0.0",
        "endpoints": [
            "/scene-image",
            "/talking-head",
            "/avatar-fullbody",
            "/tts",
            "/animate-image"
        ]
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/scene-image", response_model=SceneImageResponse)
async def generate_scene_image(req: SceneImageRequest):
    """Generate scene image using FLUX.2-dev"""
    try:
        # Generate image using HuggingFace Inference API
        img = flux_client.text_to_image(
            req.prompt,
            width=req.width,
            height=req.height,
        )
        
        # Save and get URL
        url, filename = save_image_and_get_url(img, prefix="scene")
        
        return SceneImageResponse(imageUrl=url, filename=filename)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@app.post("/talking-head", response_model=MediaResponse)
async def generate_talking_head(req: TalkingHeadRequest):
    """
    Generate talking-head video using memo (ActivateLLC/memo)
    Integrated directly - no separate service needed
    """
    if not MEMO_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="memo repo not configured. Add as submodule: git submodule add https://github.com/ActivateLLC/memo.git"
        )
    
    try:
        # Download input files
        image_data = requests.get(req.imageUrl).content
        audio_data = requests.get(req.audioUrl).content
        
        # Save temp files
        image_path = MEDIA_DIR / f"temp_image_{uuid.uuid4()}.png"
        audio_path = MEDIA_DIR / f"temp_audio_{uuid.uuid4()}.wav"
        output_path = MEDIA_DIR / f"talking_head_{uuid.uuid4()}.mp4"
        
        with open(image_path, "wb") as f:
            f.write(image_data)
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        
        # Call memo's inference function directly
        # generate_talking_head_video(
        #     image_path=str(image_path),
        #     audio_path=str(audio_path),
        #     output_path=str(output_path),
        #     duration=req.duration
        # )
        
        # TODO: Replace this with actual memo inference call
        raise HTTPException(
            status_code=501,
            detail="memo inference not yet implemented. Import and call memo's generation function here."
        )
        
        # url = f"/media/{output_path.name}"
        # return MediaResponse(videoUrl=url, filename=output_path.name)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Talking-head generation failed: {str(e)}")
    finally:
        # Cleanup temp files
        if 'image_path' in locals() and image_path.exists():
            image_path.unlink()
        if 'audio_path' in locals() and audio_path.exists():
            audio_path.unlink()


@app.post("/avatar-fullbody", response_model=MediaResponse)
async def generate_fullbody_avatar(req: AvatarRequest):
    """
    Generate full-body or upper-body avatar using HunyuanVideo-Avatar
    Integrated directly from ActivateLLC/creaiVideo-Avatar
    """
    if not AVATAR_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="creaiVideo-Avatar repo not configured. Add as submodule: git submodule add https://github.com/ActivateLLC/creaiVideo-Avatar.git"
        )
    
    try:
        # Download input files
        image_data = requests.get(req.imageUrl).content
        audio_data = requests.get(req.audioUrl).content
        
        # Save temp files
        image_path = MEDIA_DIR / f"temp_image_{uuid.uuid4()}.png"
        audio_path = MEDIA_DIR / f"temp_audio_{uuid.uuid4()}.wav"
        output_path = MEDIA_DIR / f"avatar_{req.style}_{uuid.uuid4()}.mp4"
        
        with open(image_path, "wb") as f:
            f.write(image_data)
        with open(audio_path, "wb") as f:
            f.write(audio_data)
        
        # Call creaiVideo-Avatar's inference function directly
        # generate_avatar_video(
        #     image_path=str(image_path),
        #     audio_path=str(audio_path),
        #     output_path=str(output_path),
        #     style=req.style
        # )
        
        # TODO: Replace this with actual HunyuanVideo-Avatar inference call
        raise HTTPException(
            status_code=501,
            detail="HunyuanVideo-Avatar inference not yet implemented. Import and call avatar generation function here."
        )
        
        # url = f"/media/{output_path.name}"
        # return MediaResponse(videoUrl=url, filename=output_path.name)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avatar generation failed: {str(e)}")
    finally:
        # Cleanup temp files
        if 'image_path' in locals() and image_path.exists():
            image_path.unlink()
        if 'audio_path' in locals() and audio_path.exists():
            audio_path.unlink()


@app.post("/tts", response_model=TTSResponse)
async def generate_tts(req: TTSRequest):
    """
    Generate text-to-speech audio
    TODO: Integrate with your preferred TTS service (ElevenLabs, PlayHT, etc.)
    """
    raise HTTPException(
        status_code=501,
        detail="TTS endpoint not yet implemented. Choose a TTS service to integrate."
    )


@app.post("/animate-image", response_model=MediaResponse)
async def animate_image(req: AnimateImageRequest):
    """
    Animate static image to video using Stable Video Diffusion or FAL img2vid
    TODO: Integrate with SVD or FAL img2vid endpoint
    """
    raise HTTPException(
        status_code=501,
        detail="Image animation endpoint not yet implemented. Integrate SVD or FAL img2vid."
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
