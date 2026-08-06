import { z } from "zod";
import { type Card } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { CopyCard } from "./schema";

export type InputType = z.infer<typeof CopyCard>;
export type ReturnType = ActionState<InputType, Card>;
