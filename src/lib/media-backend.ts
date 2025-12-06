/**
 * Creai Media Backend Client
 * Client-side functions for calling the task-based media generation backend
 */

const MEDIA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDIA_BACKEND_URL || "http://localhost:8000";

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

export interface AudioAsset {
  audioId: string;
  audioUrl: string;
  transcript: string;
  duration: number;
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
export async function createCharacter(
  character: Character,
): Promise<Character> {
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
 * Upload audio file
 */
export async function uploadAudio(file: File): Promise<AudioAsset> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${MEDIA_BACKEND_URL}/audio/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Audio upload failed");
  return response.json();
}

/**
 * Import audio from YouTube
 */
export async function importYoutubeAudio(url: string): Promise<AudioAsset> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/audio/from-youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) throw new Error("YouTube import failed");
  return response.json();
}

/**
 * Start live audio session
 */
export async function startLiveAudio(): Promise<{ liveSessionId: string }> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/audio/live/start`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to start live session");
  return response.json();
}

/**
 * Send live audio chunk
 */
export async function sendLiveAudioChunk(
  liveSessionId: string,
  chunk: Blob,
): Promise<void> {
  const formData = new FormData();
  formData.append("liveSessionId", liveSessionId);
  formData.append("chunk", chunk);

  const response = await fetch(`${MEDIA_BACKEND_URL}/audio/live/chunk`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Failed to send audio chunk");
}

/**
 * Stop live audio session
 */
export async function stopLiveAudio(
  liveSessionId: string,
): Promise<AudioAsset> {
  const response = await fetch(`${MEDIA_BACKEND_URL}/audio/live/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liveSessionId }),
  });
  if (!response.ok) throw new Error("Failed to stop live session");
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
