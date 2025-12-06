/**
 * Creai Media Backend Client
 * Client-side functions for calling the media generation backend
 */

const MEDIA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDIA_BACKEND_URL || "http://localhost:8000";

export interface SceneImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
}

export interface SceneImageResult {
  imageUrl: string;
  filename: string;
}

export interface TalkingHeadOptions {
  imageUrl: string;
  audioUrl: string;
  duration?: number;
}

export interface AvatarOptions {
  imageUrl: string;
  audioUrl: string;
  style?: "full-body" | "upper-body";
}

export interface MediaResult {
  videoUrl: string;
  filename: string;
}

export interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;
}

export interface TTSResult {
  audioUrl: string;
  filename: string;
}

export interface AnimateImageOptions {
  imageUrl: string;
  duration?: number;
  fps?: number;
}

/**
 * Generate a scene image using FLUX.2-dev
 */
export async function generateSceneImage(
  options: SceneImageOptions
): Promise<SceneImageResult> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/scene-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: options.prompt,
      width: options.width || 1024,
      height: options.height || 1024,
      num_inference_steps: options.num_inference_steps || 50,
      guidance_scale: options.guidance_scale || 7.5,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Scene image generation failed");
  }

  return response.json();
}

/**
 * Generate a talking-head video from image and audio
 * Uses memo (ActivateLLC/memo) for close-up face/upper-body animation
 */
export async function generateTalkingHead(
  options: TalkingHeadOptions
): Promise<MediaResult> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/talking-head`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl: options.imageUrl,
      audioUrl: options.audioUrl,
      duration: options.duration,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Talking-head generation failed");
  }

  return response.json();
}

/**
 * Generate a full-body or upper-body avatar video
 * Uses HunyuanVideo-Avatar (ActivateLLC/creaiVideo-Avatar)
 */
export async function generateFullBodyAvatar(
  options: AvatarOptions
): Promise<MediaResult> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/avatar-fullbody`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl: options.imageUrl,
      audioUrl: options.audioUrl,
      style: options.style || "full-body",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Avatar generation failed");
  }

  return response.json();
}

/**
 * Generate text-to-speech audio
 * TODO: Will be implemented once TTS service is chosen
 */
export async function generateTTS(options: TTSOptions): Promise<TTSResult> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: options.text,
      voice: options.voice || "default",
      speed: options.speed || 1.0,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "TTS generation failed");
  }

  return response.json();
}

/**
 * Animate a static image to video
 * TODO: Will be implemented with Stable Video Diffusion or FAL img2vid
 */
export async function animateImage(
  options: AnimateImageOptions
): Promise<MediaResult> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/animate-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl: options.imageUrl,
      duration: options.duration || 3.0,
      fps: options.fps || 24,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Image animation failed");
  }

  return response.json();
}

/**
 * Check if media backend is available
 */
export async function checkMediaBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MEDIA_BACKEND_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
