import { z } from "zod";
import { type Card } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { DeleteCard } from "./schema";

export type InputType = z.infer<typeof DeleteCard>;
export type ReturnType = ActionState<InputType, Card>;
