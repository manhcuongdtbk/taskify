import * as z from "zod";
import { type ActionState } from "@/lib/create-safe-action.types";
import { StripeRedirectSchema } from "./schema";

export type InputType = z.infer<typeof StripeRedirectSchema>;
export type ReturnType = ActionState<InputType, string>;
