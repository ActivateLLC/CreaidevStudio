"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AvatarMode,
  generateAudio,
  generateAvatar,
  generateImage,
} from "@/lib/media-backend";
import { Image, Loader2, MessageSquare, Mic, User, Video } from "lucide-react";
import { useState } from "react";
import { AddMediaDialog } from "./add-media";

interface MediaGeneratorProps {
  onMediaGenerated?: (url: string, type: "image" | "video" | "audio") => void;
}

export function MediaGenerator({ onMediaGenerated }: MediaGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "scene" | "talking-head" | "avatar" | "tts"
  >("scene");
  const [isLoading, setIsLoading] = useState(false);

  // Scene Image state
  const [scenePrompt, setScenePrompt] = useState("");

  // Talking Head state
  const [talkingHeadImage, setTalkingHeadImage] = useState("");
  const [talkingHeadAudio, setTalkingHeadAudio] = useState("");

  // Avatar state
  const [avatarImage, setAvatarImage] = useState("");
  const [avatarAudio, setAvatarAudio] = useState("");
  const [avatarMode, setAvatarMode] = useState<AvatarMode>(
    AvatarMode.FULL_BODY,
  );

  // TTS state
  const [ttsText, setTtsText] = useState("");

  const handleGenerateScene = async () => {
    if (!scenePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scene description",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateImage({ prompt: scenePrompt });
      toast({
        title: "Scene Generated",
        description: "Your scene image has been created",
      });
      if (result.mediaUrl) {
        onMediaGenerated?.(result.mediaUrl, "image");
      }
      setIsOpen(false);
      setScenePrompt("");
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTalkingHead = async () => {
    if (!talkingHeadImage || !talkingHeadAudio) {
      toast({
        title: "Error",
        description: "Please provide both image and audio URLs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateAvatar({
        mode: AvatarMode.HEAD,
        imageUrl: talkingHeadImage,
        audioUrl: talkingHeadAudio,
      });
      toast({
        title: "Talking Head Generated",
        description: "Your talking-head video has been created",
      });
      if (result.mediaUrl) {
        onMediaGenerated?.(result.mediaUrl, "video");
      }
      setIsOpen(false);
      setTalkingHeadImage("");
      setTalkingHeadAudio("");
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarImage || !avatarAudio) {
      toast({
        title: "Error",
        description: "Please provide both image and audio URLs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateAvatar({
        mode: avatarMode,
        imageUrl: avatarImage,
        audioUrl: avatarAudio,
      });
      toast({
        title: "Avatar Generated",
        description: `Your ${avatarMode} avatar video has been created`,
      });
      if (result.mediaUrl) {
        onMediaGenerated?.(result.mediaUrl, "video");
      }
      setIsOpen(false);
      setAvatarImage("");
      setAvatarAudio("");
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTTS = async () => {
    if (!ttsText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text for TTS",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateAudio({ text: ttsText });
      toast({
        title: "TTS Generated",
        description: "Your audio has been created",
      });
      if (result.mediaUrl) {
        onMediaGenerated?.(result.mediaUrl, "audio");
      }
      setIsOpen(false);
      setTtsText("");
    } catch (error) {
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "Not yet implemented",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Video className="mr-2 h-4 w-4" />
          Generate Media
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Media Generator</DialogTitle>
          <DialogDescription>
            Generate scenes, avatars, and voiceovers using AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "scene" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("scene")}
          >
            <Image className="mr-2 h-4 w-4" />
            Scene
          </Button>
          <Button
            variant={activeTab === "talking-head" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("talking-head")}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Talking Head
          </Button>
          <Button
            variant={activeTab === "avatar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("avatar")}
          >
            <User className="mr-2 h-4 w-4" />
            Full Avatar
          </Button>
          <Button
            variant={activeTab === "tts" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tts")}
          >
            <Video className="mr-2 h-4 w-4" />
            TTS
          </Button>
        </div>

        <div className="space-y-4 py-4">
          {activeTab === "scene" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="scene-prompt">Scene Description</Label>
                <Textarea
                  id="scene-prompt"
                  placeholder="Describe the scene you want to generate..."
                  value={scenePrompt}
                  onChange={(e) => setScenePrompt(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleGenerateScene}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Scene Image"
                )}
              </Button>
            </>
          )}

          {activeTab === "talking-head" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="th-image">Character Image URL</Label>
                <Input
                  id="th-image"
                  placeholder="https://example.com/face.png"
                  value={talkingHeadImage}
                  onChange={(e) => setTalkingHeadImage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="th-audio">Audio URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="th-audio"
                    placeholder="https://example.com/audio.wav"
                    value={talkingHeadAudio}
                    onChange={(e) => setTalkingHeadAudio(e.target.value)}
                  />
                  <AddMediaDialog
                    trigger={
                      <Button
                        variant="secondary"
                        size="icon"
                        title="Add Audio Source"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    }
                    onMediaAdded={(url) => setTalkingHeadAudio(url)}
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerateTalkingHead}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Talking Head"
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Creates close-up face/upper-body animation using memo
              </p>
            </>
          )}

          {activeTab === "avatar" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="avatar-image">Character Image URL</Label>
                <Input
                  id="avatar-image"
                  placeholder="https://example.com/person.png"
                  value={avatarImage}
                  onChange={(e) => setAvatarImage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar-audio">Audio URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar-audio"
                    placeholder="https://example.com/speech.wav"
                    value={avatarAudio}
                    onChange={(e) => setAvatarAudio(e.target.value)}
                  />
                  <AddMediaDialog
                    trigger={
                      <Button
                        variant="secondary"
                        size="icon"
                        title="Add Audio Source"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    }
                    onMediaAdded={(url) => setAvatarAudio(url)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar-style">Avatar Style</Label>
                <Select
                  value={avatarMode}
                  onValueChange={(value) => setAvatarMode(value as AvatarMode)}
                >
                  <SelectTrigger id="avatar-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AvatarMode.FULL_BODY}>
                      Full Body
                    </SelectItem>
                    <SelectItem value={AvatarMode.UPPER_BODY}>
                      Upper Body
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerateAvatar}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Avatar Video"
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Creates full/upper-body avatar using HunyuanVideo-Avatar
              </p>
            </>
          )}

          {activeTab === "tts" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tts-text">Text to Speech</Label>
                <Textarea
                  id="tts-text"
                  placeholder="Enter the text you want to convert to speech..."
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  rows={6}
                />
              </div>
              <Button
                onClick={handleGenerateTTS}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Audio"
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                TTS service not yet configured
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
