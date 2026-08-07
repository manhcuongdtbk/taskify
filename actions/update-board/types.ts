import * as z from "zod";
import { type Board } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { UpdateBoardSchema } from "./schema";

export type InputType = z.infer<typeof UpdateBoardSchema>;
export type ReturnType = ActionState<InputType, Board>;
