import * as z from "zod";
import { type ActionState } from "@/lib/create-safe-action.types";
import { UpdateListOrderSchema } from "./schema";
import { type List } from "@/app/generated/prisma/client";

export type InputType = z.infer<typeof UpdateListOrderSchema>;
export type ReturnType = ActionState<InputType, List[]>;
