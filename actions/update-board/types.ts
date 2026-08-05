import { z } from "zod";
import { type Board } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { UpdateBoard } from "./schema";

export type InputType = z.infer<typeof UpdateBoard>;
export type ReturnType = ActionState<InputType, Board>;
