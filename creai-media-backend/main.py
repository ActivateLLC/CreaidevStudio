"""
Creai Media Backend - Task-based AI generation orchestrator

Architecture:
- Layer A: Engine adapters (FLUX, memo, Hunyuan, TTS, etc.)
- Layer B: Orchestrator service (this file)
- Layer C: CreaidevStudio UI

Task-based API design:
- POST /generate/image
- POST /generate/video
- POST /generate/avatar
- POST /generate/audio
- POST /compose

Each task supports multiple providers, allowing flexibility and future model swaps.
"""

import os
import sys
import uuid
import json
from pathlib import Path
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests

# Add paths for integrated repos
MEMO_PATH = Path(os.getenv("MEMO_PATH", "./memo"))
AVATAR_PATH = Path(os.getenv("AVATAR_PATH", "./creaiVideo-Avatar"))

if MEMO_PATH.exists():
    sys.path.insert(0, str(MEMO_PATH))
if AVATAR_PATH.exists():
    sys.path.insert(0, str(AVATAR_PATH))

# Configuration
MEDIA_DIR = Path(os.getenv("MEDIA_DIR", "./media"))
MEDIA_DIR.mkdir(exist_ok=True)
CHARACTERS_DB = Path(os.getenv("CHARACTERS_DB", "./characters.json"))
RECIPES_DB = Path(os.getenv("RECIPES_DB", "./recipes"))
RECIPES_DB.mkdir(exist_ok=True)

app = FastAPI(
    title="Creai Media Backend",
    description="Task-based AI media generation orchestrator",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# ENUMS & TYPES
# ============================================================================

class Provider(str, Enum):
    FLUX = "flux"
    FAL = "fal"
    MEMO = "memo"
    HUNYUAN = "hunyuan"
    OPENAI = "openai"
    ELEVENLABS = "elevenlabs"
    SVD = "svd"


class TaskType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AVATAR = "avatar"
    AUDIO = "audio"
    COMPOSE = "compose"


class AvatarMode(str, Enum):
    HEAD = "head"
    UPPER_BODY = "upper_body"
    FULL_BODY = "full_body"


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ImageGenerationRequest(BaseModel):
    prompt: str
    provider: Optional[Provider] = Provider.FLUX
    preset: Optional[str] = None
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    seed: Optional[int] = None
    characterId: Optional[str] = None


class VideoGenerationRequest(BaseModel):
    prompt: Optional[str] = None
    imageUrl: Optional[str] = None
    provider: Optional[Provider] = Provider.SVD
    preset: Optional[str] = None
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    duration: Optional[float] = 3.0
    fps: Optional[int] = 24


class AvatarGenerationRequest(BaseModel):
    mode: AvatarMode = AvatarMode.FULL_BODY
    characterId: Optional[str] = None
    imageUrl: Optional[str] = None
    audioUrl: Optional[str] = None
    script: Optional[str] = None
    provider: Optional[Provider] = None  # Auto-select based on mode if None
    preset: Optional[str] = None
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AudioGenerationRequest(BaseModel):
    text: str
    voice: Optional[str] = "default"
    characterId: Optional[str] = None
    provider: Optional[Provider] = Provider.OPENAI
    preset: Optional[str] = None
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ComposeRequest(BaseModel):
    scenes: List[Dict[str, Any]]
    transitions: Optional[List[str]] = None
    outputFormat: Optional[str] = "mp4"
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)


class GenerationResponse(BaseModel):
    jobId: str
    status: JobStatus
    taskType: TaskType
    provider: Provider
    mediaUrl: Optional[str] = None
    recipe: Dict[str, Any]
    createdAt: str
    completedAt: Optional[str] = None
    error: Optional[str] = None


class Character(BaseModel):
    id: str
    name: str
    referenceImages: List[str]
    defaultProvider: Provider
    stylePrompt: Optional[str] = None
    voice: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


# ============================================================================
# CHARACTER MANAGEMENT
# ============================================================================

def load_characters() -> Dict[str, Character]:
    """Load characters from JSON database"""
    if not CHARACTERS_DB.exists():
        return {}
    with open(CHARACTERS_DB) as f:
        try:
            data = json.load(f)
            return {c["id"]: Character(**c) for c in data.get("characters", [])}
        except json.JSONDecodeError:
            return {}


def save_characters(characters: Dict[str, Character]):
    """Save characters to JSON database"""
    data = {"characters": [c.dict() for c in characters.values()]}
    with open(CHARACTERS_DB, "w") as f:
        json.dump(data, f, indent=2)


def get_character(character_id: str) -> Optional[Character]:
    """Get character by ID"""
    characters = load_characters()
    return characters.get(character_id)


# ============================================================================
# RECIPE STORAGE (for reproducibility)
# ============================================================================

def save_recipe(job_id: str, task_type: TaskType, request_data: Dict[str, Any], 
                provider: Provider, result: Dict[str, Any]):
    """Save generation recipe for reproducibility"""
    recipe = {
        "jobId": job_id,
        "taskType": task_type,
        "provider": provider,
        "request": request_data,
        "result": result,
        "timestamp": datetime.utcnow().isoformat()
    }
    recipe_path = RECIPES_DB / f"{job_id}.json"
    with open(recipe_path, "w") as f:
        json.dump(recipe, f, indent=2)
    return recipe


def load_recipe(job_id: str) -> Optional[Dict[str, Any]]:
    """Load recipe for re-running with modifications"""
    recipe_path = RECIPES_DB / f"{job_id}.json"
    if not recipe_path.exists():
        return None
    with open(recipe_path) as f:
        return json.load(f)


# ============================================================================
# ENGINE ADAPTERS (Layer A)
# ============================================================================

class BaseAdapter:
    """Base class for engine adapters"""
    
    def __init__(self):
        self.name = self.__class__.__name__
    
    def generate(self, **kwargs) -> str:
        """Generate media and return URL"""
        raise NotImplementedError


class FluxAdapter(BaseAdapter):
    """Adapter for FLUX.2-dev image generation"""
    
    def __init__(self):
        super().__init__()
        from huggingface_hub import InferenceClient
        self.client = InferenceClient("black-forest-labs/FLUX.2-dev", 
                                      token=os.getenv("HF_TOKEN"))
    
    def generate(self, prompt: str, width: int = 1024, height: int = 1024, 
                 seed: Optional[int] = None, **kwargs) -> str:
        """Generate image using FLUX"""
        img = self.client.text_to_image(prompt, width=width, height=height)
        
        # Save image
        filename = f"flux_{uuid.uuid4()}.png"
        filepath = MEDIA_DIR / filename
        img.save(filepath)
        
        return f"/media/{filename}"


class MemoAdapter(BaseAdapter):
    """Adapter for memo talking-head generation"""
    
    def __init__(self):
        super().__init__()
        # TODO: Import memo when submodule is added
        # from memo.inference import generate_talking_head
        self.available = MEMO_PATH.exists()
    
    def generate(self, imageUrl: str, audioUrl: str, **kwargs) -> str:
        """Generate talking-head video using memo"""
        if not self.available:
            raise HTTPException(
                status_code=501,
                detail="memo not available. Run: cd creai-media-backend && ./setup-submodules.sh"
            )
        
        # TODO: Implement actual memo call
        # Download inputs, call memo inference, return video URL
        raise HTTPException(status_code=501, detail="memo integration in progress")


class HunyuanAdapter(BaseAdapter):
    """Adapter for HunyuanVideo-Avatar full-body generation"""
    
    def __init__(self):
        super().__init__()
        # TODO: Import when submodule is added
        self.available = AVATAR_PATH.exists()
    
    def generate(self, imageUrl: str, audioUrl: str, mode: str = "full_body", **kwargs) -> str:
        """Generate avatar video using HunyuanVideo"""
        if not self.available:
            raise HTTPException(
                status_code=501,
                detail="creaiVideo-Avatar not available. Run: cd creai-media-backend && ./setup-submodules.sh"
            )
        
        # TODO: Implement actual Hunyuan call
        raise HTTPException(status_code=501, detail="Hunyuan integration in progress")


# ============================================================================
# PROVIDER REGISTRY
# ============================================================================

class ProviderRegistry:
    """Registry of available providers for each task type"""
    
    def __init__(self):
        self.adapters = {
            TaskType.IMAGE: {
                Provider.FLUX: FluxAdapter(),
            },
            TaskType.AVATAR: {
                Provider.MEMO: MemoAdapter(),
                Provider.HUNYUAN: HunyuanAdapter(),
            },
            # TODO: Add more providers
        }
    
    def get_adapter(self, task_type: TaskType, provider: Provider) -> BaseAdapter:
        """Get adapter for task + provider combination"""
        task_adapters = self.adapters.get(task_type, {})
        adapter = task_adapters.get(provider)
        
        if not adapter:
            raise HTTPException(
                status_code=400,
                detail=f"Provider '{provider}' not available for task '{task_type}'"
            )
        
        return adapter
    
    def get_default_provider(self, task_type: TaskType, mode: Optional[str] = None) -> Provider:
        """Get default provider for a task"""
        if task_type == TaskType.IMAGE:
            return Provider.FLUX
        elif task_type == TaskType.AVATAR:
            if mode == AvatarMode.HEAD or mode == AvatarMode.UPPER_BODY:
                return Provider.MEMO
            else:
                return Provider.HUNYUAN
        elif task_type == TaskType.AUDIO:
            return Provider.OPENAI
        elif task_type == TaskType.VIDEO:
            return Provider.SVD
        else:
            raise HTTPException(status_code=400, detail=f"No default provider for {task_type}")


registry = ProviderRegistry()


# ============================================================================
# TASK ORCHESTRATION (Layer B)
# ============================================================================

@app.get("/")
def root():
    return {
        "service": "Creai Media Backend",
        "version": "2.0.0",
        "architecture": "task-based",
        "endpoints": [
            "/generate/image",
            "/generate/video",
            "/generate/avatar",
            "/generate/audio",
            "/compose",
            "/characters",
            "/jobs/{jobId}"
        ]
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "providers": {
            "flux": True,
            "memo": MEMO_PATH.exists(),
            "hunyuan": AVATAR_PATH.exists(),
        }
    }


@app.post("/generate/image", response_model=GenerationResponse)
async def generate_image(req: ImageGenerationRequest):
    """
    Generate an image from text prompt
    Supports: FLUX.2-dev, FAL, etc.
    """
    job_id = str(uuid.uuid4())
    provider = req.provider or registry.get_default_provider(TaskType.IMAGE)
    
    try:
        # Enhance prompt with character style if provided
        final_prompt = req.prompt
        if req.characterId:
            character = get_character(req.characterId)
            if character and character.stylePrompt:
                final_prompt = f"{req.prompt}, {character.stylePrompt}"
        
        # Get adapter and generate
        adapter = registry.get_adapter(TaskType.IMAGE, provider)
        media_url = adapter.generate(
            prompt=final_prompt,
            width=req.width,
            height=req.height,
            seed=req.seed,
            **req.params
        )
        
        # Save recipe
        recipe = save_recipe(
            job_id, TaskType.IMAGE, req.dict(), provider,
            {"mediaUrl": media_url}
        )
        
        return GenerationResponse(
            jobId=job_id,
            status=JobStatus.COMPLETED,
            taskType=TaskType.IMAGE,
            provider=provider,
            mediaUrl=media_url,
            recipe=recipe,
            createdAt=datetime.utcnow().isoformat(),
            completedAt=datetime.utcnow().isoformat()
        )
    
    except Exception as e:
        return GenerationResponse(
            jobId=job_id,
            status=JobStatus.FAILED,
            taskType=TaskType.IMAGE,
            provider=provider,
            recipe={},
            createdAt=datetime.utcnow().isoformat(),
            error=str(e)
        )


@app.post("/generate/avatar", response_model=GenerationResponse)
async def generate_avatar(req: AvatarGenerationRequest):
    """
    Generate avatar video with character consistency
    
    Modes:
    - head: Close-up talking head (uses memo)
    - upper_body: Upper body with gestures (uses memo)
    - full_body: Full body avatar (uses HunyuanVideo)
    
    Supports characterId for consistency across scenes
    """
    job_id = str(uuid.uuid4())
    
    # Resolve character if provided
    character = None
    if req.characterId:
        character = get_character(req.characterId)
        if not character:
            raise HTTPException(status_code=404, detail=f"Character '{req.characterId}' not found")
        
        # Use character defaults if not specified
        if not req.imageUrl and character.referenceImages:
            req.imageUrl = character.referenceImages[0]
        if not req.provider:
            req.provider = character.defaultProvider
    
    # Select provider based on mode
    if not req.provider:
        req.provider = registry.get_default_provider(TaskType.AVATAR, req.mode)
    
    try:
        # Get adapter and generate
        adapter = registry.get_adapter(TaskType.AVATAR, req.provider)
        
        # If script provided but no audio, need TTS first
        audio_url = req.audioUrl
        if req.script and not audio_url:
            # TODO: Generate TTS first
            raise HTTPException(status_code=400, detail="TTS not yet implemented. Provide audioUrl.")
        
        media_url = adapter.generate(
            imageUrl=req.imageUrl,
            audioUrl=audio_url,
            mode=req.mode,
            **req.params
        )
        
        # Save recipe
        recipe = save_recipe(
            job_id, TaskType.AVATAR, req.dict(), req.provider,
            {"mediaUrl": media_url, "characterId": req.characterId}
        )
        
        return GenerationResponse(
            jobId=job_id,
            status=JobStatus.COMPLETED,
            taskType=TaskType.AVATAR,
            provider=req.provider,
            mediaUrl=media_url,
            recipe=recipe,
            createdAt=datetime.utcnow().isoformat(),
            completedAt=datetime.utcnow().isoformat()
        )
    
    except Exception as e:
        return GenerationResponse(
            jobId=job_id,
            status=JobStatus.FAILED,
            taskType=TaskType.AVATAR,
            provider=req.provider or Provider.HUNYUAN,
            recipe={},
            createdAt=datetime.utcnow().isoformat(),
            error=str(e)
        )


@app.post("/generate/video", response_model=GenerationResponse)
async def generate_video(req: VideoGenerationRequest):
    """
    Generate video from image or text
    Supports: Stable Video Diffusion, FAL img2vid, etc.
    """
    job_id = str(uuid.uuid4())
    provider = req.provider or registry.get_default_provider(TaskType.VIDEO)
    
    return GenerationResponse(
        jobId=job_id,
        status=JobStatus.FAILED,
        taskType=TaskType.VIDEO,
        provider=provider,
        recipe={},
        createdAt=datetime.utcnow().isoformat(),
        error="Video generation not yet implemented"
    )


@app.post("/generate/audio", response_model=GenerationResponse)
async def generate_audio(req: AudioGenerationRequest):
    """
    Generate audio from text (TTS)
    Supports: OpenAI TTS, ElevenLabs, PlayHT, etc.
    """
    job_id = str(uuid.uuid4())
    provider = req.provider or registry.get_default_provider(TaskType.AUDIO)
    
    # Use character voice if provided
    if req.characterId:
        character = get_character(req.characterId)
        if character and character.voice:
            req.voice = character.voice
    
    return GenerationResponse(
        jobId=job_id,
        status=JobStatus.FAILED,
        taskType=TaskType.AUDIO,
        provider=provider,
        recipe={},
        createdAt=datetime.utcnow().isoformat(),
        error="TTS not yet implemented"
    )


@app.post("/compose", response_model=GenerationResponse)
async def compose_scenes(req: ComposeRequest):
    """
    Compose multiple scenes into final video using ffmpeg
    Handles transitions, overlays, etc.
    """
    job_id = str(uuid.uuid4())
    
    return GenerationResponse(
        jobId=job_id,
        status=JobStatus.FAILED,
        taskType=TaskType.COMPOSE,
        provider=Provider.FLUX,  # Not really applicable here
        recipe={},
        createdAt=datetime.utcnow().isoformat(),
        error="Composition not yet implemented"
    )


# ============================================================================
# CHARACTER MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/characters")
def list_characters():
    """List all registered characters"""
    characters = load_characters()
    return {"characters": list(characters.values())}


@app.get("/characters/{character_id}")
def get_character_endpoint(character_id: str):
    """Get character by ID"""
    character = get_character(character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@app.post("/characters")
def create_character(character: Character):
    """Create new character"""
    characters = load_characters()
    if character.id in characters:
        raise HTTPException(status_code=400, detail="Character already exists")
    
    characters[character.id] = character
    save_characters(characters)
    return character


@app.put("/characters/{character_id}")
def update_character(character_id: str, character: Character):
    """Update existing character"""
    characters = load_characters()
    if character_id not in characters:
        raise HTTPException(status_code=404, detail="Character not found")
    
    character.id = character_id  # Ensure ID matches
    characters[character_id] = character
    save_characters(characters)
    return character


@app.delete("/characters/{character_id}")
def delete_character(character_id: str):
    """Delete character"""
    characters = load_characters()
    if character_id not in characters:
        raise HTTPException(status_code=404, detail="Character not found")
    
    del characters[character_id]
    save_characters(characters)
    return {"status": "deleted", "characterId": character_id}


# ============================================================================
# JOB MANAGEMENT
# ============================================================================

@app.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    """Get job status and result"""
    recipe = load_recipe(job_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Job not found")
    return recipe


@app.post("/jobs/{job_id}/rerun")
def rerun_job(job_id: str, modifications: Optional[Dict[str, Any]] = None):
    """Re-run a job with optional modifications"""
    recipe = load_recipe(job_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Apply modifications to original request
    request_data = recipe["request"]
    if modifications:
        request_data.update(modifications)
    
    # TODO: Re-dispatch based on task type
    return {"status": "not_implemented", "message": "Rerun functionality coming soon"}


# ============================================================================
# STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
