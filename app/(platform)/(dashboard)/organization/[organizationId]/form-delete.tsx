"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

export default function FormDelete() {
  const { pending } = useFormStatus();

  return (
    <Button variant="destructive" size="sm" disabled={pending}>
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
