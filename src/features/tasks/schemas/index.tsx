import { z } from 'zod';

export const taskProjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    key: z.string().optional().nullable(),
  })
  .passthrough();

export const taskMilestoneSchema = z
  .object({
    id: z.string(),
    title: z.string(),
  })
  .passthrough();

export const taskTypeRefSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
  })
  .passthrough();

export const taskStatusRefSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    color_code: z.string().optional().nullable().default(''),
    sequence_order: z.number().optional().nullable().default(0),
  })
  .passthrough();

export const taskDetail = z
  .object({
    id: z.string(),
    project_id: z.string().optional().nullable(),
    project: taskProjectSchema.optional().nullable(),
    milestone_id: z.string().optional().nullable(),
    milestone: taskMilestoneSchema.optional().nullable(),
    task_type_id: z.string().optional().nullable(),
    task_type: taskTypeRefSchema.optional().nullable(),
    task_status_id: z.string().optional().nullable(),
    task_status: taskStatusRefSchema.optional().nullable(),
    user_requested_id: z.string().optional().nullable(),
    task_key: z.string().optional().nullable(),
    title: z.string(),
    description: z.string().optional().nullable().default(''),
    priority: z.string().optional().nullable().default('medium'),
    estimated_hours: z.union([z.string(), z.number()]).optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    mom_number: z.string().optional().nullable(),
    mom_date: z.string().optional().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .passthrough();

export const SchemaValidateTask = {
  task: z
    .object({
      project_id: z.string().min(1, 'Project is required'),
      milestone_id: z.string().min(1, 'Milestone is required'),
      task_type_id: z.string().min(1, 'Task type is required'),
      task_status_id: z.string().min(1, 'Task status is required'),
      title: z
        .string()
        .min(2, 'Task title must be at least 2 characters')
        .max(255, 'Task title cannot exceed 255 characters'),
      description: z.string().optional().nullable().default(''),
      priority: z.string().min(1, 'Priority is required').default('medium'),
      estimated_hours: z.coerce
        .number()
        .min(0, 'Estimated hours must be 0 or greater')
        .default(0),
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().min(1, 'End date is required'),
      mom_number: z.string().optional().nullable().default(''),
      mom_date: z.string().optional().nullable().default(''),
    })
    .refine(
      (data) =>
        !data.start_date || !data.end_date || data.end_date >= data.start_date,
      {
        message: 'End date must be on or after start date',
        path: ['end_date'],
      },
    ),
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
  taskDetail,
  taskTrackingItem: z
    .object({
      id: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
      task_type: taskTypeRefSchema.optional().nullable(),
      task_status: taskStatusRefSchema.optional().nullable(),
      task_assigners: z
        .array(
          z
            .object({
              id: z.string(),
              user: z
                .object({
                  id: z.string(),
                  name: z.string(),
                  avatar_url: z.string().nullable().optional(),
                })
                .passthrough()
                .nullable()
                .optional(),
              name: z.string().optional(),
              avatar_url: z.string().nullable().optional(),
            })
            .passthrough(),
        )
        .optional()
        .default([]),
      task_key: z.string().optional().nullable(),
      title: z.string(),
      description: z.string().optional().nullable().default(''),
      priority: z.string().optional().nullable(),
      estimated_hours: z.union([z.string(), z.number()]).optional().nullable(),
      start_date: z.string().optional().nullable(),
      end_date: z.string().optional().nullable(),
    })
    .passthrough(),
};

export type FormPayloadTask = {
  Task: z.infer<typeof SchemaValidateTask.task>;
};

export interface In_TaskMutationPayload {
  project_id: string;
  milestone_id: string;
  task_type_id: string;
  task_status_id: string;
  title: string;
  description?: string | null;
  priority: string;
  estimated_hours: number;
  start_date: string;
  end_date: string;
  mom_number?: string | null;
  mom_date?: string | null;
}
