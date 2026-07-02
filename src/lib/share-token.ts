const SHARE_KEY = import.meta.env.VITE_SHARE_OBFUSCATION_KEY ?? "contracts-liquid-glass-v1";

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
  if (!base || base === "/") return "";
  return base.replace(/\/$/, "");
}

export function buildShareUrl(documentId: string, password: string): string {
  const url = new URL(`${appBasePath()}/d/${documentId}`, window.location.origin);
  url.searchParams.set("k", encodeShareKey(password));
  return url.toString();
}

export function parseShareFromLocation(
  documentId: string,
  search: string,
): { documentId: string; password: string } | null {
  const params = new URLSearchParams(search);
  const token = params.get("k");
  if (!token) return null;
  try {
    return { documentId, password: decodeShareKey(token) };
  } catch {
    return null;
  }
}
