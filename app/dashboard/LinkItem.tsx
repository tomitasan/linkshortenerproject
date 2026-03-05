'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EditLinkDialog } from './EditLinkDialog';
import { DeleteLinkDialog } from './DeleteLinkDialog';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface LinkItemProps {
  link: {
    id: number;
    shortCode: string;
    originalUrl: string;
    createdAt: Date;
  };
}

export function LinkItem({ link }: LinkItemProps) {
  const [copied, setCopied] = useState(false);
  const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/l/${link.shortCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {link.originalUrl}
            </CardTitle>
            <CardDescription>
              Short code:{' '}
              <span className="font-mono font-semibold">{link.shortCode}</span>
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <EditLinkDialog
              linkId={link.id}
              currentUrl={link.originalUrl}
              currentShortCode={link.shortCode}
            />
            <DeleteLinkDialog linkId={link.id} shortCode={link.shortCode} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(link.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Short URL:</span>{' '}
            <span className="font-mono flex-1">{shortUrl}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              <Copy className="h-4 w-4 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
