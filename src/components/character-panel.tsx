"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import {
  type Character,
  Provider,
  createCharacter,
  listCharacters,
} from "@/lib/media-backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, User } from "lucide-react";
import { useState } from "react";

export function CharacterPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: listCharacters,
  });

  const createMutation = useMutation({
    mutationFn: createCharacter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      setIsCreateOpen(false);
      toast({
        title: "Character created",
        description: "Your new character has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create character: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const provider = formData.get("provider") as Provider;
    const referenceImage = formData.get("referenceImage") as string;

    if (!name || !provider) return;

    createMutation.mutate({
      id: crypto.randomUUID(),
      name,
      defaultProvider: provider,
      referenceImages: referenceImage ? [referenceImage] : [],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground">
          Characters
        </h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Character</DialogTitle>
              <DialogDescription>
                Add a new character to your library.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Sarah" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Default Provider</Label>
                <Select name="provider" defaultValue={Provider.MEMO}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Provider.MEMO}>Memo (Avatar)</SelectItem>
                    <SelectItem value={Provider.FLUX}>Flux (Image)</SelectItem>
                    <SelectItem value={Provider.HUNYUAN}>
                      Hunyuan (Video)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceImage">Reference Image URL</Label>
                <Input
                  id="referenceImage"
                  name="referenceImage"
                  placeholder="https://..."
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-2 overflow-y-auto">
        {data?.characters.map((char) => (
          <div
            key={char.id}
            className="flex flex-col gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="aspect-square rounded-md bg-muted overflow-hidden relative">
              {char.referenceImages[0] ? (
                <img
                  src={char.referenceImages[0]}
                  alt={char.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="text-xs font-medium truncate">{char.name}</div>
          </div>
        ))}
        {data?.characters.length === 0 && (
          <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
            No characters yet.
          </div>
        )}
      </div>
    </div>
  );
}
