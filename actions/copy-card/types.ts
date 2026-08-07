import * as z from "zod";
import { type Card } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { CopyCardSchema } from "./schema";

export type InputType = z.infer<typeof CopyCardSchema>;
export type ReturnType = ActionState<InputType, Card>;
