import { z } from "zod";

export const SchemaValidateAccess = {
  user: z.object({
    name: z.string().min(2, "Name is required"),
    nip: z.string().min(2, "Nip is required"),
    email: z.string().email("Enter a valid email address"),
    phone_number: z.string().max(20, "Phone is required"),
    password: z.string().optional(),
  }),
  role: z.object({
    name: z.string().min(2, "Role name is required"),
    description: z.string().min(2, "Description is required"),
  }),
  permission: z.object({
    name: z.string().min(2, "Permission name is required"),
    module: z.string().min(2, "Module name is required"),
    description: z.string().min(2, "Description is required"),
  }),
  paginationMeta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total_items: z.number(),
    total_pages: z.number(),
    has_next_page: z.boolean(),
    has_previous_page: z.boolean(),
  }),
  permissionItem: z.object({
    id: z.string(),
    name: z.string(),
    module: z.string(),
    description: z.string().nullable().optional().transform((v) => v ?? null),
    created_at: z.string(),
    updated_at: z.string(),
    created_by: z.string().nullable().optional(),
    updated_by: z.string().nullable().optional(),
  }),
  roleItem: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional().transform((v) => v ?? null),
    created_at: z.string(),
    updated_at: z.string(),
    created_by: z.string().nullable().optional(),
    updated_by: z.string().nullable().optional(),
  })
};

export type FormPayloadAccess = {
  User: z.infer<typeof SchemaValidateAccess.user>;
  Role: z.infer<typeof SchemaValidateAccess.role>;
  Permission: z.infer<typeof SchemaValidateAccess.permission>;
};


export const roleDetailSchema = SchemaValidateAccess.roleItem.extend({
  permissions: z.array(SchemaValidateAccess.permissionItem).default([]),
});


export interface In_RoleMutationPayload {
  name: string;
  description: string | null;
}

export interface In_PermissionMutationPayload {
  name: string;
  module: string;
  description: string | null;
}