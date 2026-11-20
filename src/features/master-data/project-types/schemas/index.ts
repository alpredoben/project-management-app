import { z } from "zod";

export const projectTypeDetail = z.object({
  id: z.string(),
  name: z.string(),
  description: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SchemaValidateProjectType = {
  projectType: z.object({
    name: z.string().min(2, "Project type name is required"),
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
  projectTypeDetail,
};

export type FormPayloadProjectType = {
  ProjectType: z.infer<typeof SchemaValidateProjectType.projectType>;
};

export interface In_ProjectTypeMutationPayload {
  name: string;
  description: string;
}
