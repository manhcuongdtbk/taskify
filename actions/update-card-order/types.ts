import { z } from "zod";
import { type ActionState } from "@/lib/create-safe-action.types";
import { UpdateCardOrder } from "./schema";
import { type Card } from "@/app/generated/prisma/client";

export type InputType = z.infer<typeof UpdateCardOrder>;
export type ReturnType = ActionState<InputType, Card[]>;
