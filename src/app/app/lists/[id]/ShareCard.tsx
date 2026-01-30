"use client";

import { useState, useEffect, useRef } from "react";
import { CopyButton } from "@/components/CopyButton";
import QRCode from "qrcode";

type ShareCardProps = {
  shareToken: string;
  shareUrl: string;
  listTitle: string;
};

export function ShareCard({
  shareToken,
  shareUrl,
  listTitle,
}: ShareCardProps): React.ReactElement {
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const qrGeneratedForUrl = useRef<string | null>(null);

  // Generate QR code client-side to avoid leaking unlisted tokens to third-party APIs
  useEffect(() => {
    if (!showQR || qrGeneratedForUrl.current === shareUrl) return;

    QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 0,
      color: {
        dark: "#343338",
        light: "#ffffff",
      },
    })
      .then((url) => {
        qrGeneratedForUrl.current = shareUrl;
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code:", err);
      });
  }, [showQR, shareUrl]);

  // Social share URLs
  const shareText = `Check out my wishlist: ${listTitle}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`Here's my wishlist:\n\n${shareUrl}`)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <>
      <div className="space-y-5">
        {/* Description */}
        <p className="text-white/70 text-center font-[family-name:var(--font-urbanist)]">
          Anyone with this link can view, reserve items, or contribute.
        </p>

        {/* URL display and actions */}
        <div className="flex items-center gap-2">
          {/* URL display */}
          <div className="flex-1 rounded-xl bg-[#3a3a3a] px-4 py-3">
            <code className="text-white/90 text-sm font-mono truncate block font-[family-name:var(--font-urbanist)]">
              /u/{shareToken}
            </code>
          </div>
          
          <CopyButton text={shareUrl} variant="dark" />
          
          {/* QR Code button */}
          <button
            onClick={() => setShowQR(true)}
            className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white transition-colors"
            title="Show QR code"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 4.5h4.5v4.5h-4.5v-4.5Zm0 10.5h4.5v4.5h-4.5v-4.5Zm10.5-10.5h4.5v4.5h-4.5v-4.5ZM12 12h1.5v3H12v-3Zm3 0h3v3h-3v-3Zm0 4.5h3v3h-3v-3Zm-3 0h1.5v1.5H12v-1.5Zm-6.75-6h1.5v1.5h-1.5v-1.5Zm10.5 0h1.5v1.5h-1.5v-1.5Z"
              />
            </svg>
          </button>

          {/* Open in new tab */}
          <a
            href={`/u/${shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white transition-colors"
            title="Open public preview"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        </div>

        {/* Social share buttons */}
        <div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-sm text-white/60 mr-1 font-[family-name:var(--font-urbanist)]">
              Quick share:
            </span>
            
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 px-3 gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors font-[family-name:var(--font-urbanist)]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>

            {/* Email */}
            <a
              href={emailUrl}
              className="inline-flex items-center justify-center h-9 px-3 gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors font-[family-name:var(--font-urbanist)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              Email
            </a>

            {/* SMS */}
            <a
              href={smsUrl}
              className="inline-flex items-center justify-center h-9 px-3 gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors font-[family-name:var(--font-urbanist)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              Text
            </a>

            {/* Twitter/X */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 px-3 gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors font-[family-name:var(--font-urbanist)]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Post
            </a>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowQR(false)}
          />

          {/* Modal */}
          <div className="relative rounded-[30px] bg-[#2b2b2b] p-6 shadow-2xl animate-modal-in max-w-sm w-full text-center">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-[#4a4a4a] text-white/70 hover:text-white hover:bg-[#5a5a5a] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-4">
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: "Asul" }}>
                Scan to view list
              </h3>
              <p className="mt-1 text-sm text-white/70 font-[family-name:var(--font-urbanist)]">
                Point your phone camera at this code
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 inline-block mb-4">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code for list"
                  className="h-48 w-48"
                />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center">
                  <svg className="h-6 w-6 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>

            <p className="text-xs text-white/60 break-all font-[family-name:var(--font-urbanist)]">
              {shareUrl}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
