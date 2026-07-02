const STORAGE_KEY = "contracts-local-docs";
const LEGACY_DRAFT_PREFIX = "contracts-draft-";

export type LocalDocumentCredential = {
  documentId: string;
  password: string;
};

export type DocumentListEntry = LocalDocumentCredential & {
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type SortField = "name" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

export type DocumentMetadata = {
  documentId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

function normalizeCredential(entry: unknown): LocalDocumentCredential | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  if (
    typeof record.documentId === "string" &&
    typeof record.password === "string"
  ) {
    return {
      documentId: record.documentId,
      password: record.password,
    };
  }
  return null;
}

function purgeLegacyDocumentContent(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_DRAFT_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage errors.
  }
}

export function loadLocalDocuments(): LocalDocumentCredential[] {
  purgeLegacyDocumentContent();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const credentials = parsed
      .map(normalizeCredential)
      .filter((entry): entry is LocalDocumentCredential => entry !== null);

    const needsMigration =
      credentials.length !== parsed.length ||
      parsed.some((entry) => {
        if (!entry || typeof entry !== "object") return true;
        const record = entry as Record<string, unknown>;
        return Object.keys(record).some(
          (key) => key !== "documentId" && key !== "password",
        );
      });

    if (needsMigration) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    }

    return credentials;
  } catch {
    return [];
  }
}

export function saveLocalDocuments(docs: LocalDocumentCredential[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  window.dispatchEvent(new CustomEvent("contracts-local-docs-changed"));
}

export function upsertLocalDocument(credential: LocalDocumentCredential): void {
  const docs = loadLocalDocuments();
  const index = docs.findIndex((d) => d.documentId === credential.documentId);
  if (index >= 0) {
    docs[index] = credential;
  } else {
    docs.push(credential);
  }
  saveLocalDocuments(docs);
}

export function removeLocalDocument(documentId: string): void {
  saveLocalDocuments(
    loadLocalDocuments().filter((d) => d.documentId !== documentId),
  );
  try {
    localStorage.removeItem(`${LEGACY_DRAFT_PREFIX}${documentId}`);
  } catch {
    // Ignore storage errors.
  }
}

export function getLocalDocument(
  documentId: string,
): LocalDocumentCredential | undefined {
  return loadLocalDocuments().find((d) => d.documentId === documentId);
}

export function isDocumentSavedLocally(documentId: string): boolean {
  return getLocalDocument(documentId) !== undefined;
}

export function mergeDocumentMetadata(
  credentials: LocalDocumentCredential[],
  metadata: Array<DocumentMetadata | null> | undefined,
): DocumentListEntry[] {
  return credentials.map((credential, index) => {
    const remote = metadata?.[index];
    if (!remote || remote.documentId !== credential.documentId) {
      return {
        ...credential,
        title: credential.documentId,
        createdAt: 0,
        updatedAt: 0,
      };
    }
    return {
      ...credential,
      title: remote.title,
      createdAt: remote.createdAt,
      updatedAt: remote.updatedAt,
    };
  });
}

export function sortLocalDocuments(
  docs: DocumentListEntry[],
  field: SortField,
  direction: SortDirection,
): DocumentListEntry[] {
  const sorted = [...docs].sort((a, b) => {
    if (field === "name") {
      return a.title.localeCompare(b.title);
    }
    if (field === "updatedAt") {
      return a.updatedAt - b.updatedAt;
    }
    return a[field] - b[field];
  });
  return direction === "asc" ? sorted : sorted.reverse();
}
