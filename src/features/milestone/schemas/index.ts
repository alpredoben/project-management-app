import { z } from 'zod';

export const milestoneProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

export const milestoneDetail = z.object({
  id: z.string(),
  project_id: z.string().optional().nullable(),
  project: milestoneProjectSchema.optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable().default(''),
  status: z.string().optional().nullable().default('open'),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().optional().nullable(),
  updated_by: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  deleted_by: z.string().optional().nullable(),
});

export const SchemaValidateMilestone = {
  milestone: z.object({
    project_id: z.string().min(1, 'Project is required'),
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .max(200, 'Title cannot exceed 200 characters'),
    description: z.string().optional().nullable().default(''),
    status: z.string().optional().default('open'),
  }),
  changeStatus: z.object({
    status: z.string().min(1, 'Status is required'),
  }),
  paginationMeta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total_items: z.number(),
    total_pages: z.number(),
    has_next_page: z.boolean(),
    has_previous_page: z.boolean(),
  }),
  milestoneDetail,
};

export type FormPayloadMilestone = {
  Milestone: z.infer<typeof SchemaValidateMilestone.milestone>;
  ChangeStatus: z.infer<typeof SchemaValidateMilestone.changeStatus>;
};

export interface In_MilestoneMutationPayload {
  project_id: string;
  title: string;
  description?: string | null;
  status?: string;
}

export interface In_ChangeMilestoneStatusPayload {
  status: string;
}
