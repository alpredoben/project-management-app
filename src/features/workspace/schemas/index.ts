import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
] as const;

export const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg"] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const workspaceDetail = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo_url: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SchemaValidateWorkspace = {
  workspace: z.object({
    name: z
      .string()
      .min(2, "Workspace name must be at least 2 characters")
      .max(100, "Workspace name cannot exceed 100 characters"),
  }),
  paginationMeta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total_items: z.number(),
    total_pages: z.number(),
    has_next_page: z.boolean(),
    has_previous_page: z.boolean(),
  }),
  workspaceDetail,
};

export type FormPayloadWorkspace = {
  Workspace: z.infer<typeof SchemaValidateWorkspace.workspace>;
};

export interface In_WorkspaceMutationPayload {
  name: string;
  file_logo?: File | null;
}
