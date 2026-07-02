import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { upsertLocalDocument } from "@/lib/local-documents";

export type CreatedDocument = {
  documentId: string;
  password: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export function useCreateDocument() {
  const createContract = useMutation(api.contracts.create);
  const [isCreating, setIsCreating] = useState(false);

  const createDocument = async (title: string): Promise<CreatedDocument | null> => {
    const trimmed = title.trim();
    if (!trimmed) return null;

    setIsCreating(true);
    try {
      const created = await createContract({ title: trimmed });
      upsertLocalDocument({
        documentId: created.documentId,
        password: created.password,
      });
      return created;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create document";
      console.error("Create document failed:", error);
      toast.error(message);
      if (
        message.includes("Could not find public function") ||
        message.includes("Failed to fetch") ||
        message.includes("Network")
      ) {
        toast.error(
          "Convex backend may not be deployed. Run npx convex dev in a terminal.",
          { duration: 6000 },
        );
      }
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createDocument, isCreating };
}
