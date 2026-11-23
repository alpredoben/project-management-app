import { z } from "zod";

export const workspaceMemberWorkspaceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logo_url: z.string().nullable().optional(),
  })
  .passthrough();

export const workspaceMemberUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable().optional(),
    nip: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
  })
  .passthrough();

export const workspaceMemberPositionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  })
  .passthrough();

export const workspaceMemberItemSchema = z
  .object({
    id: z.string(),
    workspace_id: z.string().optional(),
    workspace: workspaceMemberWorkspaceSchema.optional(),
    user_id: z.string().optional(),
    user: workspaceMemberUserSchema.optional(),
    position_id: z.string().optional(),
    position: workspaceMemberPositionSchema.optional(),
    joined_at: z.string().optional().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    created_by: z.string().optional().nullable(),
    updated_by: z.string().optional().nullable(),
    deleted_at: z.string().optional().nullable(),
    deleted_by: z.string().optional().nullable(),
  })
  .passthrough();

export const workspaceMemberDetailSchema = z
  .object({
    id: z.string(),
    workspace_id: z.string().optional(),
    workspace: workspaceMemberWorkspaceSchema.optional(),
    user_id: z.string().optional(),
    user: workspaceMemberUserSchema.optional(),
    position_id: z.string().optional(),
    position: workspaceMemberPositionSchema.optional(),
    joined_at: z.string().optional().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    created_by: z.string().optional().nullable(),
    updated_by: z.string().optional().nullable(),
    deleted_at: z.string().optional().nullable(),
    deleted_by: z.string().optional().nullable(),
  })
  .passthrough();

export const workspaceMemberMutationResponseSchema = z
  .object({
    id: z.string(),
    workspace_id: z.string().optional(),
    user_id: z.string().optional(),
    position_id: z.string().optional(),
    joined_at: z.string().optional().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    created_by: z.string().optional().nullable(),
    updated_by: z.string().optional().nullable(),
    deleted_at: z.string().optional().nullable(),
    deleted_by: z.string().optional().nullable(),
    workspace: workspaceMemberWorkspaceSchema.optional(),
    user: workspaceMemberUserSchema.optional(),
    position: workspaceMemberPositionSchema.optional(),
  })
  .passthrough();

export const SchemaValidateWorkspaceMember = {
  member: z.object({
    workspace_id: z.string().min(1, "Workspace is required"),
    user_id: z.string().min(1, "User is required"),
    position_id: z.string().min(1, "Position is required"),
  }),
  paginationMeta: z
    .object({
      current_page: z.number(),
      per_page: z.number(),
      total_items: z.number(),
      total_pages: z.number(),
      has_next_page: z.boolean(),
      has_previous_page: z.boolean(),
    })
    .passthrough(),
  memberItem: workspaceMemberItemSchema,
  memberDetail: workspaceMemberDetailSchema,
  mutationResponse: workspaceMemberMutationResponseSchema,
};

export type FormPayloadWorkspaceMember = {
  Member: z.infer<typeof SchemaValidateWorkspaceMember.member>;
};

export type In_WorkspaceMemberMutationResponse = z.infer<
  typeof workspaceMemberMutationResponseSchema
>;

export interface In_WorkspaceMemberMutationPayload {
  workspace_id: string;
  user_id: string;
  position_id: string;
}
