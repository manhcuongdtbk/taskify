import { z } from "zod";
import { type ActionState } from "@/lib/create-safe-action.types";
import { StripeRedirect } from "./schema";

export type InputType = z.infer<typeof StripeRedirect>;
export type ReturnType = ActionState<InputType, string>;
