import * as z from "zod";
import { type Board } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { DeleteBoardSchema } from "./schema";

export type InputType = z.infer<typeof DeleteBoardSchema>;
export type ReturnType = ActionState<InputType, Board>;
