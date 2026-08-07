import * as z from "zod";
import { type Card } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { CreateCardSchema } from "./schema";

export type InputType = z.infer<typeof CreateCardSchema>;
export type ReturnType = ActionState<InputType, Card>;
