import { z } from "zod";

export const projectStatusDetail = z.object({
  id: z.string(),
  name: z.string(),
  color_code: z.string().default(""),
  description: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  sequence_order: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SchemaValidateProjectStatus = {
  projectStatus: z.object({
    name: z.string().min(2, "Project status name is required"),
    color_code: z
      .string()
      .regex(/^$|^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color code (e.g. #3B82F6) or empty")
      .default(""),
    description: z.string().min(2, "Description is required"),
    sequence_order: z.coerce
      .number({ invalid_type_error: "No. Order must be a valid number" })
      .int("No. Order must be an integer")
      .min(0, "No. Order must be at least 0"),
  }),
  paginationMeta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total_items: z.number(),
    total_pages: z.number(),
    has_next_page: z.boolean(),
    has_previous_page: z.boolean(),
  }),
  projectStatusDetail,
};

export type FormPayloadProjectStatus = {
  ProjectStatus: z.infer<typeof SchemaValidateProjectStatus.projectStatus>;
};

export interface In_ProjectStatusMutationPayload {
  name: string;
  color_code: string;
  description: string;
  sequence_order: number;
}
