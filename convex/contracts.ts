import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import {
  assertEditAccess,
  createContractRecord,
  getContractWithPassword,
  metadataValidator,
  publicContractValidator,
  toPublicContract,
} from "./lib/contracts";
import { isEditLockExpired, EDIT_REQUEST_MUTE_MS } from "./lib/password";

const lockMode = v.union(v.literal("edit"), v.literal("read"));

const editRequestStatusValidator = v.object({
  showEditorPrompt: v.boolean(),
  requestPending: v.boolean(),
});

function isActiveEditor(
  editorSessionId: string | undefined,
  editorHeartbeatAt: number | undefined,
  sessionId: string,
  now: number,
): boolean {
  return (
    editorSessionId === sessionId &&
    !isEditLockExpired(editorHeartbeatAt, now)
  );
}

export const create = mutation({
  args: {
    title: v.optional(v.string()),
  },
  returns: v.object({
    documentId: v.string(),
    password: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    return await createContractRecord(ctx, args.title);
  },
});

export const get = query({
  args: {
    documentId: v.string(),
    password: v.string(),
  },
  returns: v.union(publicContractValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const contract = await getContractWithPassword(
        ctx,
        args.documentId,
        args.password,
      );
      return toPublicContract(contract);
    } catch {
      return null;
    }
  },
});

export const refreshMetadata = query({
  args: {
    documents: v.array(
      v.object({
        documentId: v.string(),
        password: v.string(),
      }),
    ),
  },
  returns: v.array(v.union(metadataValidator, v.null())),
  handler: async (ctx, args) => {
    const results = [];
    for (const item of args.documents) {
      try {
        const contract = await getContractWithPassword(
          ctx,
          item.documentId,
          item.password,
        );
        results.push({
          documentId: contract.documentId,
          title: contract.title,
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
        });
      } catch {
        results.push(null);
      }
    }
    return results;
  },
});

export const update = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
    title: v.optional(v.string()),
    markdown: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await getContractWithPassword(
      ctx,
      args.documentId,
      args.password,
    );
    await assertEditAccess(contract, args.sessionId);

    const updates: {
      title?: string;
      markdown?: string;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title;
    if (args.markdown !== undefined) updates.markdown = args.markdown;

    await ctx.db.patch("contracts", contract._id, updates);
    return null;
  },
});

export const remove = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await getContractWithPassword(
      ctx,
      args.documentId,
      args.password,
    );
    await ctx.db.delete("contracts", contract._id);
    return null;
  },
});

export const acquireEditLock = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
  },
  returns: v.object({ mode: lockMode }),
  handler: async (ctx, args) => {
    const contract = await getContractWithPassword(
      ctx,
      args.documentId,
      args.password,
    );
    const now = Date.now();
    const expired = isEditLockExpired(contract.editorHeartbeatAt, now);
    const ownsLock = contract.editorSessionId === args.sessionId;

    if (expired || !contract.editorSessionId || ownsLock) {
      await ctx.db.patch("contracts", contract._id, {
        editorSessionId: args.sessionId,
        editorHeartbeatAt: now,
      });
      return { mode: "edit" as const };
    }

    return { mode: "read" as const };
  },
});

export const heartbeatEditLock = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
  },
  returns: v.object({ mode: lockMode }),
  handler: async (ctx, args) => {
    const contract = await getContractWithPassword(
      ctx,
      args.documentId,
      args.password,
    );
    const now = Date.now();

    if (contract.editorSessionId !== args.sessionId) {
      return { mode: "read" as const };
    }

    await ctx.db.patch("contracts", contract._id, { editorHeartbeatAt: now });
    return { mode: "edit" as const };
  },
});

export const getEditRequestStatus = query({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
  },
  returns: editRequestStatusValidator,
  handler: async (ctx, args) => {
    try {
      const contract = await getContractWithPassword(
        ctx,
        args.documentId,
        args.password,
      );
      const now = Date.now();
      const muted = (contract.editRequestMutedUntil ?? 0) > now;
      const hasRequest = contract.editRequestSessionId !== undefined;
      const isEditor = isActiveEditor(
        contract.editorSessionId,
        contract.editorHeartbeatAt,
        args.sessionId,
        now,
      );
      const isRequester = contract.editRequestSessionId === args.sessionId;

      return {
        showEditorPrompt: hasRequest && isEditor && !muted,
        requestPending: hasRequest && isRequester,
      };
    } catch {
      return {
        showEditorPrompt: false,
        requestPending: false,
      };
    }
  },
});

export const requestEditAccess = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
  },
  returns: v.object({ mode: lockMode }),
  handler: async (ctx, args) => {
    const contract = await getContractWithPassword(
      ctx,
      args.documentId,
      args.password,
    );
    const now = Date.now();
    const expired = isEditLockExpired(contract.editorHeartbeatAt, now);
    const ownsLock = contract.editorSessionId === args.sessionId;

    if (expired || !contract.editorSessionId || ownsLock) {
      await ctx.db.patch("contracts", contract._id, {
        editorSessionId: args.sessionId,
        editorHeartbeatAt: now,
        editRequestSessionId: undefined,
        editRequestAt: undefined,
      });
      return { mode: "edit" as const };
    }

    await ctx.db.patch("contracts", contract._id, {
      editRequestSessionId: args.sessionId,
      editRequestAt: now,
    });
    return { mode: "read" as const };
  },
});

export const approveEditRequest = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await getContractWithPassword(
      ctx,
      args.documentId,
      args.password,
    );
    const now = Date.now();

    if (
      !isActiveEditor(
        contract.editorSessionId,
        contract.editorHeartbeatAt,
        args.sessionId,
        now,
      )
    ) {
      throw new Error("Only the active editor can approve edit requests");
    }

    if (!contract.editRequestSessionId) {
      throw new Error("No pending edit request");
    }

    await ctx.db.patch("contracts", contract._id, {
      editorSessionId: contract.editRequestSessionId,
      editorHeartbeatAt: now,
      editRequestSessionId: undefined,
      editRequestAt: undefined,
    });
    return null;
  },
});

export const dismissEditRequest = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await getContractWithPassword(
      ctx,
      args.documentId,
      args.password,
    );
    const now = Date.now();

    if (
      !isActiveEditor(
        contract.editorSessionId,
        contract.editorHeartbeatAt,
        args.sessionId,
        now,
      )
    ) {
      throw new Error("Only the active editor can dismiss edit requests");
    }

    await ctx.db.patch("contracts", contract._id, {
      editRequestSessionId: undefined,
      editRequestAt: undefined,
    });
    return null;
  },
});

export const muteEditRequests = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contract = await getContractWithPassword(
      ctx,
      args.documentId,
      args.password,
    );
    const now = Date.now();

    if (
      !isActiveEditor(
        contract.editorSessionId,
        contract.editorHeartbeatAt,
        args.sessionId,
        now,
      )
    ) {
      throw new Error("Only the active editor can mute edit requests");
    }

    await ctx.db.patch("contracts", contract._id, {
      editRequestMutedUntil: now + EDIT_REQUEST_MUTE_MS,
      editRequestSessionId: undefined,
      editRequestAt: undefined,
    });
    return null;
  },
});

export const releaseEditLock = mutation({
  args: {
    documentId: v.string(),
    password: v.string(),
    sessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let contract;
    try {
      contract = await getContractWithPassword(
        ctx,
        args.documentId,
        args.password,
      );
    } catch {
      return null;
    }

    if (contract.editorSessionId === args.sessionId) {
      await ctx.db.patch("contracts", contract._id, {
        editorSessionId: undefined,
        editorHeartbeatAt: undefined,
      });
    }
    return null;
  },
});

export const getInternal = internalQuery({
  args: {
    documentId: v.string(),
    password: v.string(),
  },
  returns: v.union(publicContractValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const contract = await getContractWithPassword(
        ctx,
        args.documentId,
        args.password,
      );
      return toPublicContract(contract);
    } catch {
      return null;
    }
  },
});
