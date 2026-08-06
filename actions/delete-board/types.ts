import { z } from "zod";
import { type Board } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { DeleteBoard } from "./schema";

export type InputType = z.infer<typeof DeleteBoard>;
export type ReturnType = ActionState<InputType, Board>;
