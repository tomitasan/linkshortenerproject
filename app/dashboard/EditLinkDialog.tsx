'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Link as LinkIcon } from 'lucide-react';
import { updateLinkAction, type UpdateLinkInput } from './actions';

interface EditLinkDialogProps {
  linkId: number;
  currentUrl: string;
  currentShortCode: string;
}

export function EditLinkDialog({
  linkId,
  currentUrl,
  currentShortCode,
}: EditLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(currentUrl);
  const [customSlug, setCustomSlug] = useState(currentShortCode);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset form when dialog opens
      setUrl(currentUrl);
      setCustomSlug(currentShortCode);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input: UpdateLinkInput = {
      linkId,
      url: url.trim(),
      customSlug: customSlug.trim(),
    };

    startTransition(async () => {
      const result = await updateLinkAction(input);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Close dialog on success
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Update the URL or custom slug for your shortened link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-url">
                <LinkIcon className="h-4 w-4 mr-1 inline" />
                URL *
              </Label>
              <Input
                id="edit-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-customSlug">Custom Slug</Label>
              <Input
                id="edit-customSlug"
                type="text"
                placeholder="my-custom-link"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                disabled={isPending}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, hyphens, and underscores allowed.
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
