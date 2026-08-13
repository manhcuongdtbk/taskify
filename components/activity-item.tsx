import { type AuditLog } from "@/app/generated/prisma/client";
import { generateAuditLogMessage } from "@/lib/generate-audit-log-message";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { format, parseISO } from "date-fns";

interface ActivityItemProps {
  data: AuditLog;
}

export const ActivityItem = ({ data }: ActivityItemProps) => {
  // Query JSON leaves DateTime as ISO strings; Prisma (RSC) gives Date.
  const createdAt =
    typeof data.createdAt === "string"
      ? parseISO(data.createdAt)
      : data.createdAt;

  return (
    <li className="flex items-center gap-x-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={data.userImage} />
      </Avatar>
      <div className="flex flex-col space-y-0.5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-neutral-700 lowercase">
            {data.userName}
          </span>{" "}
          {generateAuditLogMessage(data)}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(createdAt, "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </li>
  );
};
