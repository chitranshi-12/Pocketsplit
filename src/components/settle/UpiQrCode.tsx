import React, { useState } from 'react';
import { Check, Copy, ExternalLink, QrCode } from 'lucide-react';

interface UpiQrCodeProps {
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}

export const UpiQrCode: React.FC<UpiQrCodeProps> = ({ upiId, payeeName, amount, note = 'Pocketsplit Settlement' }) => {
  const [copied, setCopied] = useState(false);

  // Standard UPI URI specification
  // upi://pay?pa=address@bank&pn=PayeeName&am=100.00&cu=INR&tn=Note
  const encodedName = encodeURIComponent(payeeName.trim());
  const encodedNote = encodeURIComponent(note.trim());
  const upiUrl = `upi://pay?pa=${upiId.trim()}&pn=${encodedName}&am=${amount.toFixed(2)}&cu=INR&tn=${encodedNote}`;

  // QR Server generates a standard high-res QR code image
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    upiUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUpi = () => {
    window.location.href = upiUrl;
  };

  return (
    <div className="flex flex-col items-center p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 my-2">
      <div className="flex items-center gap-2 mb-3 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
        <QrCode className="w-4 h-4" />
        <span>Scan with Google Pay, PhonePe, or Paytm</span>
      </div>

      {/* QR Code Container */}
      <div className="bg-white p-3 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <img
          src={qrImageUrl}
          alt={`UPI QR code to pay ₹${amount.toFixed(2)} to ${payeeName}`}
          className="w-48 h-48 rounded-lg object-contain"
          onError={(e) => {
            // In case of network sandbox, show fallback text box
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="text-center mt-2 text-xs text-slate-500 font-mono">
          UPI ID: <span className="font-semibold text-slate-700">{upiId}</span>
        </div>
      </div>

      {/* Amount Pill */}
      <div className="mt-3 text-center">
        <span className="text-xl font-bold text-slate-900 dark:text-white">
          ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3 w-full max-w-xs">
        <button
          type="button"
          onClick={handleOpenUpi}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Pay via UPI App</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          title="Copy UPI Deep Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
