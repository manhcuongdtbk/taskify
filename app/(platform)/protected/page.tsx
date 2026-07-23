import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function ProtectedPage() {
  await auth.protect();

  const user = await currentUser();
  const { userId } = await auth();

  return (
    <div>
      User: {user?.emailAddresses.map((email) => email.emailAddress).join(", ")}
      userId: {userId}
      <UserButton />
    </div>
  );
}
