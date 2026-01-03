"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Debounce delay in milliseconds
const DEBOUNCE_MS = 500;

// Types matching the API response
export type LinkPreviewStatus = "idle" | "loading" | "success" | "error";

export interface LinkPreviewPrice {
  amount: number;
  currency: string;
}

export interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  price: LinkPreviewPrice | null;
  domain: string;
  normalizedUrl: string;
}

interface UseLinkPreviewResult {
  status: LinkPreviewStatus;
  data: LinkPreviewData | null;
  error: string | null;
  fetch: (url: string, force?: boolean) => void;
  reset: () => void;
}

/**
 * Hook to fetch link preview metadata with debouncing
 *
 * Usage:
 * ```tsx
 * const { status, data, error, fetch, reset } = useLinkPreview();
 *
 * // In onChange handler:
 * fetch(newUrl);
 *
 * // To force refresh (bypass cache):
 * fetch(url, true);
 *
 * // To reset state:
 * reset();
 * ```
 */
export function useLinkPreview(): UseLinkPreviewResult {
  const [status, setStatus] = useState<LinkPreviewStatus>("idle");
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for debouncing and request cancellation
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUrlRef = useRef<string>("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    lastUrlRef.current = "";
    setStatus("idle");
    setData(null);
    setError(null);
  }, []);

  const fetchPreview = useCallback(async (url: string, force = false) => {
    // Cancel any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Validate URL format (basic check)
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      reset();
      return;
    }

    // Check if it looks like a valid URL
    try {
      const parsed = new URL(trimmedUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        reset();
        return;
      }
    } catch {
      // Not a valid URL yet - wait for more input
      reset();
      return;
    }

    // Skip if same URL (unless forcing refresh)
    if (!force && trimmedUrl === lastUrlRef.current && status === "success") {
      return;
    }

    lastUrlRef.current = trimmedUrl;

    // Debounce the actual fetch
    debounceTimerRef.current = setTimeout(async () => {
      setStatus("loading");
      setError(null);

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/link-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedUrl, force }),
          signal: abortControllerRef.current.signal,
        });

        const result = await response.json();

        if (result.ok) {
          setStatus("success");
          setData({
            title: result.data.title,
            description: result.data.description,
            image: result.data.image,
            images: result.data.images ?? [],
            price: result.data.price,
            domain: result.domain,
            normalizedUrl: result.normalizedUrl,
          });
          setError(null);
        } else {
          setStatus("error");
          setData(null);
          setError(result.error?.message ?? "Failed to fetch preview");
        }
      } catch (err) {
        // Ignore abort errors
        if ((err as Error).name === "AbortError") {
          return;
        }

        setStatus("error");
        setData(null);
        setError((err as Error).message ?? "Network error");
      }
    }, DEBOUNCE_MS);
  }, [reset, status]);

  return {
    status,
    data,
    error,
    fetch: fetchPreview,
    reset,
  };
}

