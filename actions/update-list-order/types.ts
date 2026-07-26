import { z } from "zod";
import { type ActionState } from "@/lib/create-safe-action";
import { UpdateListOrder } from "./schema";
import { type List } from "@/app/generated/prisma/client";

export type InputType = z.infer<typeof UpdateListOrder>;
export type ReturnType = ActionState<InputType, List[]>;
