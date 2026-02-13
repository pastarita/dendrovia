/**
 * useCodeLoader — Fetches file content when CodeReader opens
 *
 * Watches codeReader.filePath from the store. When a file path is set
 * and content is empty, fetches the file content from a configurable
 * base URL and updates the store.
 */

import { useEffect, useRef } from 'react';
import { useOculusStore } from '../store/useOculusStore';

export interface CodeLoaderOptions {
  /** Base URL for fetching file content. Defaults to '/api/files/' */
  baseUrl?: string;
  /**
   * Custom fetch function. Receives the full file path and should
   * return the file content as a string. If provided, baseUrl is ignored.
   */
  fetchContent?: (filePath: string) => Promise<string>;
}

const PLACEHOLDER = '// Unable to load file content.\n// The file may not be available in this environment.';

/**
 * Hook that automatically loads file content when the CodeReader
 * is opened with an empty content string.
 *
 * Place this hook inside a component that mounts when OCULUS is active
 * (e.g. CodeReader itself or the OculusProvider tree).
 */
export function useCodeLoader(options: CodeLoaderOptions = {}) {
  const { baseUrl = '/api/files/', fetchContent } = options;

  const filePath = useOculusStore((s) => s.codeReader.filePath);
  const content = useOculusStore((s) => s.codeReader.content);
  const loading = useOculusStore((s) => s.codeReader.loading);

  // Track the request so we can cancel stale fetches
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Only fetch when there is a filePath, no content, and loading is flagged
    if (!filePath || content || !loading) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const store = useOculusStore.getState();

    async function load() {
      try {
        let text: string;

        if (fetchContent) {
          text = await fetchContent(filePath!);
        } else {
          const url = `${baseUrl}${encodeURIComponent(filePath!)}`;
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          text = await res.text();
        }

        // Guard against stale responses
        if (controller.signal.aborted) return;

        useOculusStore.getState().setCodeContent(text);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        const message =
          err instanceof Error ? err.message : 'Unknown error loading file';
        useOculusStore.getState().setCodeError(message);
        // Set fallback content so the viewer is not stuck on a spinner
        useOculusStore.getState().setCodeContent(PLACEHOLDER);
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [filePath, content, loading, baseUrl, fetchContent]);
}
