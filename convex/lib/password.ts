const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export const EDIT_LOCK_LEASE_MS = 30_000;
export const EDIT_REQUEST_MUTE_MS = 5 * 60 * 1000;

export function generateDocumentId(): string {
  return crypto.randomUUID();
}

export function generatePassword(length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join(
    "",
  );
}

export function isEditLockExpired(
  heartbeatAt: number | undefined,
  now: number,
): boolean {
  if (heartbeatAt === undefined) {
    return true;
  }
  return now - heartbeatAt > EDIT_LOCK_LEASE_MS;
}
