import * as z from "zod";
import { type Board } from "@/app/generated/prisma/client";
import { type ActionState } from "@/lib/create-safe-action.types";
import { CreateBoardSchema } from "./schema";

export type InputType = z.infer<typeof CreateBoardSchema>;
export type ReturnType = ActionState<InputType, Board>;

/** Produced by components/form/form-picker.tsx. */
export type BoardImageInput = InputType["image"];
