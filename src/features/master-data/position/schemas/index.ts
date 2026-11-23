import { z } from "zod";

export const positionDetail = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SchemaValidatePosition = {
  position: z.object({
    name: z.string().min(2, "Position name is required"),
  }),
  paginationMeta: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total_items: z.number(),
    total_pages: z.number(),
    has_next_page: z.boolean(),
    has_previous_page: z.boolean(),
  }),
  positionDetail,
};

export type FormPayloadPosition = {
  Position: z.infer<typeof SchemaValidatePosition.position>;
};

export interface In_PositionMutationPayload {
  name: string;
  slug: string;
}
