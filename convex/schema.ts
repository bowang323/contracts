import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contracts: defineTable({
    documentId: v.string(),
    password: v.string(),
    title: v.string(),
    markdown: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    editorSessionId: v.optional(v.string()),
    editorHeartbeatAt: v.optional(v.number()),
    editRequestSessionId: v.optional(v.string()),
    editRequestAt: v.optional(v.number()),
    editRequestMutedUntil: v.optional(v.number()),
  }).index("by_document_id", ["documentId"]),
});
