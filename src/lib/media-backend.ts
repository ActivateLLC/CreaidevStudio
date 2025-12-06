/**
 * Creai Media Backend Client
 * Client-side functions for calling the task-based media generation backend
 */

const MEDIA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDIA_BACKEND_URL || "http://localhost:8000";

export enum Provider {
  FLUX = "flux",
  FAL = "fal",
  MEMO = "memo",
  HUNYUAN = "hunyuan",
  OPENAI = "openai",
  ELEVENLABS = "elevenlabs",
  SVD = "svd",
}

export enum TaskType {
  IMAGE = "image",
  VIDEO = "video",
  AVATAR = "avatar",
  AUDIO = "audio",
  COMPOSE = "compose",
}

export enum AvatarMode {
  HEAD = "head",
  UPPER_BODY = "upper_body",
  FULL_BODY = "full_body",
}

export interface Character {
  id: string;
  name: string;
  referenceImages: string[];
  defaultProvider: Provider;
  stylePrompt?: string;
  voice?: string;
  metadata?: Record<string, any>;
}

export interface GenerationResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  taskType: TaskType;
  provider: Provider;
  mediaUrl?: string;
  recipe: any;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// --- API Functions ---

/**
 * List all characters
 */
export async function listCharacters(): Promise<{ characters: Character[] }> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/characters`);
  if (!response.ok) throw new Error("Failed to fetch characters");
  return response.json();
}

/**
 * Create a new character
 */
export async function createCharacter(character: Character): Promise<Character> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(character),
  });
  if (!response.ok) throw new Error("Failed to create character");
  return response.json();
}

/**
 * Generate an image (Scene)
 */
export async function generateImage(params: {
  prompt: string;
  characterId?: string;
  provider?: Provider;
  width?: number;
  height?: number;
  seed?: number;
}): Promise<GenerationResponse> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/generate/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error("Image generation failed");
  return response.json();
}

/**
 * Generate an avatar video
 */
export async function generateAvatar(params: {
  mode: AvatarMode;
  characterId?: string;
  imageUrl?: string;
  audioUrl?: string;
  script?: string;
  provider?: Provider;
}): Promise<GenerationResponse> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/generate/avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error("Avatar generation failed");
  return response.json();
}

/**
 * Generate audio (TTS)
 */
export async function generateAudio(params: {
  text: string;
  characterId?: string;
  voice?: string;
  provider?: Provider;
}): Promise<GenerationResponse> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/generate/audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error("Audio generation failed");
  return response.json();
}

/**
 * Check backend health
 */
export async function checkMediaBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MEDIA_BACKEND_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
