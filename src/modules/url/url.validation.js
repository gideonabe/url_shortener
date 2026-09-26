import { z } from "zod";

export const createUrlSchema = z.object({
  longUrl: z.url("Invalid URL."),
})