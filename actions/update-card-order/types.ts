import * as z from "zod";
import { type ActionState } from "@/lib/create-safe-action.types";
import { UpdateCardOrderSchema } from "./schema";
import { type Card } from "@/app/generated/prisma/client";

export type InputType = z.infer<typeof UpdateCardOrderSchema>;
export type ReturnType = ActionState<InputType, Card[]>;
