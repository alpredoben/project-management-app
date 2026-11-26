import { z } from 'zod';

export const projectWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
});

export const projectTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
});

export const projectStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  color_code: z.string().optional().nullable().default(''),
  sequence_order: z.number().optional().nullable().default(0),
  description: z.string().optional().nullable(),
});

export const projectDetail = z.object({
  id: z.string(),
  workspace_id: z.string().optional().nullable(),
  workspace: projectWorkspaceSchema.optional().nullable(),
  project_type_id: z.string().optional().nullable(),
  project_type: projectTypeSchema.optional().nullable(),
  project_status_id: z.string().optional().nullable(),
  project_status: projectStatusSchema.optional().nullable(),
  name: z.string(),
  key: z.string().optional().nullable(),
  description: z.string().optional().nullable().default(''),
  start_date: z.string(),
  end_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SchemaValidateProject = {
  project: z
    .object({
      workspace_id: z.string().min(1, 'Workspace is required'),
      project_type_id: z.string().min(1, 'Project type is required'),
      project_status_id: z.string().min(1, 'Project status is required'),
      name: z
        .string()
        .min(2, 'Project name must be at least 2 characters')
        .max(200, 'Project name cannot exceed 200 characters'),
      description: z.string().optional().nullable().default(''),
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().min(1, 'End date is required'),
    })
    .refine(
      (data) => !data.start_date || !data.end_date || data.end_date >= data.start_date,
      {
        message: 'End date must be on or after start date',
        path: ['end_date'],
      },
    ),
  changeStatus: z.object({
    project_status_id: z.string().min(1, 'Project status is required'),
  }),
  changeType: z.object({
    project_type_id: z.string().min(1, 'Project type is required'),
  }),
  paginationMeta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total_items: z.number(),
    total_pages: z.number(),
    has_next_page: z.boolean(),
    has_previous_page: z.boolean(),
  }),
  projectDetail,
};

export type FormPayloadProject = {
  Project: z.infer<typeof SchemaValidateProject.project>;
  ChangeStatus: z.infer<typeof SchemaValidateProject.changeStatus>;
  ChangeType: z.infer<typeof SchemaValidateProject.changeType>;
};

export interface In_ProjectMutationPayload {
  workspace_id: string;
  project_type_id: string;
  project_status_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
}

export interface In_ChangeProjectStatusPayload {
  project_status_id: string;
}

export interface In_ChangeProjectTypePayload {
  project_type_id: string;
}
