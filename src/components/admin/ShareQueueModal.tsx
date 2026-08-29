import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { Queue } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  QrCode, 
  Globe
} from 'lucide-react';

interface ShareQueueModalProps {
  queue: Queue | null;
  isOpen: boolean;
  onClose: () => void;
  orgName?: string;
}

export const ShareQueueModal: React.FC<ShareQueueModalProps> = ({
  queue,
  isOpen,
  onClose,
  orgName
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  if (!queue) return null;

  const appBaseUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const bookingUrl = `${appBaseUrl}/org/${queue.ORG_ID}`;

  useEffect(() => {
    if (isOpen && bookingUrl) {
      QRCode.toDataURL(bookingUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, bookingUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.getElementById('share-booking-url') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const posterWidth = 600;
    const posterHeight = 740;
    canvas.width = posterWidth;
    canvas.height = posterHeight;

    // 1. Background pure white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, posterWidth, posterHeight);

    // 2. Header Brand
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QUELESS SMART DIGITAL PASS', posterWidth / 2, 60);

    // 3. Organization Name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText(orgName || 'Service Counter', posterWidth / 2, 110);

    // 4. Counter Name & Prefix
    ctx.fillStyle = '#52525b';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`${queue.NAME} (${queue.COUNTER_LABEL || 'Counter 1'})`, posterWidth / 2, 145);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Prefix: ${queue.PREFIX}`, posterWidth / 2, 178);

    // 5. Card behind QR
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 2;
    const cardSize = 380;
    const cardX = (posterWidth - cardSize) / 2;
    const cardY = 210;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardSize, cardSize, 16);
    ctx.stroke();

    // 6. Draw QR Code image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, cardX + 20, cardY + 20, cardSize - 40, cardSize - 40);

      // 7. Footer Instructions
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('Scan with Smartphone to Book Token', posterWidth / 2, 635);

      ctx.fillStyle = '#71717a';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Zero app download required • Instant live turn alerts', posterWidth / 2, 670);

      const link = document.createElement('a');
      link.download = `QR-Pass-${queue.NAME.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrDataUrl;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Counter & Customer Pass Link"
      subtitle={`Counter: ${queue.NAME} (${queue.COUNTER_LABEL || 'Counter 1'})`}
      maxWidth="md"
    >
      <div className="space-y-5 pt-2">
        {/* Shareable Link Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
            <Globe size={14} className="text-blue-600" />
            Customer Direct Booking Link
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="share-booking-url"
                type="text"
                readOnly
                value={bookingUrl}
                className="w-full rounded-lg bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 text-xs text-black font-mono focus:outline-none select-all"
              />
            </div>
            <Button
              type="button"
              variant={copied ? "emerald" : "primary"}
              size="md"
              onClick={handleCopyLink}
              leftIcon={copied ? <Check size={15} /> : <Copy size={15} />}
              className="font-bold shrink-0 bg-black text-white"
            >
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500">
            Share this link via WhatsApp, SMS, or website so customers can book turn tokens from home.
          </p>
        </div>

        {/* QR Code Section */}
        <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-black" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-black">Counter QR Code Signage</h4>
          </div>

          {/* QR Code Display Card */}
          <div className="p-3 bg-white rounded-xl shadow-xs border border-zinc-200">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Queue QR Code"
                className="w-44 h-44 rounded-lg object-contain"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-zinc-400 text-xs">
                Generating QR Code...
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <span className="text-xs font-bold text-black block">
              Scan with Smartphone Camera
            </span>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              Print and place this QR code at your reception, door, or counter for instant walk-up digital ticketing.
            </p>
          </div>

          {/* Download QR Button */}
          <div className="pt-2 w-full flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="emerald"
              size="md"
              className="flex-1 font-bold"
              onClick={handleDownloadQR}
              leftIcon={<Download size={15} />}
              disabled={!qrDataUrl}
            >
              Download Printable Poster (PNG)
            </Button>

            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="font-bold w-full"
                leftIcon={<ExternalLink size={14} />}
              >
                Open Page
              </Button>
            </a>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-100 text-right">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
