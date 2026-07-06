const SHARE_KEY = import.meta.env.VITE_SHARE_OBFUSCATION_KEY ?? "contracts-liquid-glass-v1";

/** Public web deployment used for share links from the desktop app. */
export const PUBLIC_WEB_APP_ORIGIN = "https://bowang323.github.io/contracts";

function toUrlSafeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromUrlSafeBase64(token: string): Uint8Array {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function xorTransform(input: Uint8Array): Uint8Array {
  const key = new TextEncoder().encode(SHARE_KEY);
  return Uint8Array.from(input, (byte, i) => byte ^ key[i % key.length]);
}

/** Opaque share token — reverses to the original password. */
export function encodeShareKey(password: string): string {
  const bytes = new TextEncoder().encode(password);
  return toUrlSafeBase64(xorTransform(bytes));
}

export function decodeShareKey(token: string): string {
  const bytes = xorTransform(fromUrlSafeBase64(token));
  return new TextDecoder().decode(bytes);
}

function appBasePath(): string {
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/" || base === "./") return "";
  return base.replace(/\/$/, "");
}

function publicShareBase(): string {
  const configured = import.meta.env.VITE_WEB_APP_ORIGIN?.trim();
  return (configured || PUBLIC_WEB_APP_ORIGIN).replace(/\/$/, "");
}

export function isElectronApp(): boolean {
  return import.meta.env.VITE_IS_ELECTRON === "true";
}

export function buildShareUrl(documentId: string, password: string): string {
  const token = encodeShareKey(password);

  // Desktop (and optional override) always points at the public GitHub Pages app.
  if (isElectronApp() || import.meta.env.VITE_WEB_APP_ORIGIN) {
    return `${publicShareBase()}/d/${encodeURIComponent(documentId)}?k=${encodeURIComponent(token)}`;
  }

  const url = new URL(`${appBasePath()}/d/${documentId}`, window.location.origin);
  url.searchParams.set("k", token);
  return url.toString();
}

export function parseShareFromLocation(
  documentId: string,
  search: string,
): { documentId: string; password: string } | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const token = params.get("k");
  if (!token) return null;
  try {
    return { documentId, password: decodeShareKey(token) };
  } catch {
    return null;
  }
}

/**
 * Parse a share URL from the web app, hash-router desktop links, or path-only forms.
 * Examples:
 * - https://bowang323.github.io/contracts/d/{id}?k={token}
 * - https://…/#/d/{id}?k={token}
 * - /contracts/d/{id}?k={token}
 */
export function parseShareUrl(
  input: string,
): { documentId: string; password: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let pathname = "";
  let search = "";

  try {
    const hashIndex = trimmed.indexOf("#");
    if (hashIndex >= 0) {
      const hashPart = trimmed.slice(hashIndex + 1);
      const queryIndex = hashPart.indexOf("?");
      pathname = queryIndex >= 0 ? hashPart.slice(0, queryIndex) : hashPart;
      search = queryIndex >= 0 ? hashPart.slice(queryIndex) : "";
    } else if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
      const url = new URL(trimmed);
      pathname = url.pathname;
      search = url.search;
    } else {
      const withBase = trimmed.startsWith("/")
        ? `https://placeholder.local${trimmed}`
        : `https://placeholder.local/${trimmed}`;
      const url = new URL(withBase);
      pathname = url.pathname;
      search = url.search;
    }
  } catch {
    return null;
  }

  const match = pathname.match(/\/d\/([^/?#]+)\/?$/);
  if (!match?.[1]) return null;

  let documentId = match[1];
  try {
    documentId = decodeURIComponent(documentId);
  } catch {
    return null;
  }

  return parseShareFromLocation(documentId, search);
}
