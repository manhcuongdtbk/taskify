import * as z from "zod";
import { type List } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { UpdateListSchema } from "./schema";

export type InputType = z.infer<typeof UpdateListSchema>;
export type ReturnType = ActionState<InputType, List>;
