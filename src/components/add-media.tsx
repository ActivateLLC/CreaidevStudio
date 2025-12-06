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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  importYoutubeAudio,
  sendLiveAudioChunk,
  startLiveAudio,
  stopLiveAudio,
  uploadAudio,
} from "@/lib/media-backend";
import {
  Loader2,
  Mic,
  Play,
  Radio,
  Save,
  Square,
  Upload,
  Youtube,
} from "lucide-react";
import { useRef, useState } from "react";

interface AddMediaDialogProps {
  onMediaAdded?: (url: string, type: "audio") => void;
  trigger?: React.ReactNode;
}

export function AddMediaDialog({ onMediaAdded, trigger }: AddMediaDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState<"clip" | "live">("clip");
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      if (recordingMode === "live") {
        setIsLoading(true);
        const { liveSessionId } = await startLiveAudio();
        setLiveSessionId(liveSessionId);
        setIsLoading(false);

        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            await sendLiveAudioChunk(liveSessionId, e.data);
          }
        };
        // Send chunks every 2 seconds
        mediaRecorder.start(2000);
      } else {
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        mediaRecorder.start();
      }

      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    if (recordingMode === "live" && liveSessionId) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsLoading(true);
      try {
        // Wait a bit for last chunk
        await new Promise((resolve) => setTimeout(resolve, 500));
        const result = await stopLiveAudio(liveSessionId);
        toast({
          title: "Live Session Saved",
          description: "Audio saved successfully",
        });
        onMediaAdded?.(result.audioUrl, "audio");
        setIsOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save live session",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setLiveSessionId(null);
      }
    } else {
      // Clip mode
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });

        setIsLoading(true);
        try {
          const result = await uploadAudio(file);
          toast({
            title: "Recording Saved",
            description: "Audio clip saved successfully",
          });
          onMediaAdded?.(result.audioUrl, "audio");
          setIsOpen(false);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload recording",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
    }

    // Stop all tracks
    for (const track of mediaRecorderRef.current.stream.getTracks()) {
      track.stop();
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsLoading(true);
    try {
      const result = await uploadAudio(uploadFile);
      toast({
        title: "File Uploaded",
        description: "Audio file uploaded successfully",
      });
      onMediaAdded?.(result.audioUrl, "audio");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleYoutubeImport = async () => {
    if (!youtubeUrl) return;
    setIsLoading(true);
    try {
      const result = await importYoutubeAudio(youtubeUrl);
      toast({
        title: "YouTube Imported",
        description: "Audio imported successfully",
      });
      onMediaAdded?.(result.audioUrl, "audio");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import from YouTube",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Mic className="mr-2 h-4 w-4" />
            Add Audio / Voice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Audio / Voice</DialogTitle>
          <DialogDescription>
            Record voice, upload files, or import from YouTube.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="record">Record</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
          </TabsList>

          <TabsContent value="record" className="space-y-4 py-4">
            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant={recordingMode === "clip" ? "default" : "outline"}
                size="sm"
                onClick={() => setRecordingMode("clip")}
                disabled={isRecording}
              >
                <Mic className="mr-2 h-4 w-4" />
                Clip Mode
              </Button>
              <Button
                variant={recordingMode === "live" ? "default" : "outline"}
                size="sm"
                onClick={() => setRecordingMode("live")}
                disabled={isRecording}
              >
                <Radio className="mr-2 h-4 w-4" />
                Live Session
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 min-h-[150px] border rounded-lg bg-muted/20">
              {isRecording ? (
                <div className="flex flex-col items-center gap-2 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    {recordingMode === "live"
                      ? "Live Session Active"
                      : "Recording..."}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Ready to{" "}
                  {recordingMode === "live" ? "start live session" : "record"}
                </div>
              )}

              {!isRecording ? (
                <Button
                  size="lg"
                  className="rounded-full w-16 h-16"
                  variant="destructive"
                  onClick={startRecording}
                  disabled={isLoading}
                >
                  <Mic className="h-8 w-8" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="rounded-full w-16 h-16"
                  variant="secondary"
                  onClick={stopRecording}
                  disabled={isLoading}
                >
                  <Square className="h-8 w-8 fill-current" />
                </Button>
              )}
            </div>

            {recordingMode === "live" && (
              <p className="text-xs text-center text-muted-foreground">
                Audio is streamed to the server in real-time.
              </p>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="audio-file">Audio File</Label>
              <Input
                id="audio-file"
                type="file"
                accept="audio/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </TabsContent>

          <TabsContent value="youtube" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
            </div>
            <Button
              onClick={handleYoutubeImport}
              disabled={!youtubeUrl || isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Audio
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
