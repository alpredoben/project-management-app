import { z } from "zod";

export const taskTypeDetail = z.object({
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

export const SchemaValidateTaskType = {
  taskType: z.object({
    name: z.string().min(2, "Task type name is required"),
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
  taskTypeDetail,
};

export type FormPayloadTaskType = {
  TaskType: z.infer<typeof SchemaValidateTaskType.taskType>;
};

export interface In_TaskTypeMutationPayload {
  name: string;
  description: string;
}
