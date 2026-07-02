import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  generateDocumentId,
  generatePassword,
  isEditLockExpired,
} from "./password";
import {
  DEFAULT_CONTRACT_MARKDOWN,
  DEFAULT_CONTRACT_TITLE,
} from "./templates";

export type ContractDoc = Doc<"contracts">;

export async function getContractByDocumentId(
  ctx: QueryCtx | MutationCtx,
  documentId: string,
): Promise<ContractDoc | null> {
  return await ctx.db
    .query("contracts")
    .withIndex("by_document_id", (q) => q.eq("documentId", documentId))
    .unique();
}

export async function getContractWithPassword(
  ctx: QueryCtx | MutationCtx,
  documentId: string,
  password: string,
): Promise<ContractDoc> {
  const contract = await getContractByDocumentId(ctx, documentId);
  if (!contract) {
    throw new Error("Document not found");
  }

  if (contract.password !== password) {
    throw new Error("Invalid password");
  }

  return contract;
}

export const publicContractValidator = v.object({
  documentId: v.string(),
  title: v.string(),
  markdown: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const metadataValidator = v.object({
  documentId: v.string(),
  title: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export function toPublicContract(contract: ContractDoc) {
  return {
    documentId: contract.documentId,
    title: contract.title,
    markdown: contract.markdown,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export async function createContractRecord(
  ctx: MutationCtx,
  title?: string,
) {
  const now = Date.now();
  const documentId = generateDocumentId();
  const password = generatePassword();
  const resolvedTitle = title?.trim() || DEFAULT_CONTRACT_TITLE;

  await ctx.db.insert("contracts", {
    documentId,
    password,
    title: resolvedTitle,
    markdown: DEFAULT_CONTRACT_MARKDOWN,
    createdAt: now,
    updatedAt: now,
  });

  return {
    documentId,
    password,
    title: resolvedTitle,
    createdAt: now,
    updatedAt: now,
  };
}

export async function assertEditAccess(
  contract: ContractDoc,
  sessionId: string,
): Promise<void> {
  const now = Date.now();
  const expired = isEditLockExpired(contract.editorHeartbeatAt, now);

  if (expired || contract.editorSessionId === sessionId) {
    return;
  }

  throw new Error("Read-only: another user is editing this document");
}
