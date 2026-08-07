import * as z from "zod";
import { type List } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { CopyListSchema } from "./schema";

export type InputType = z.infer<typeof CopyListSchema>;
export type ReturnType = ActionState<InputType, List>;
