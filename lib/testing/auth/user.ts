import { currentUser } from "@clerk/nextjs/server";
import { Factory } from "fishery";

type ClerkCurrentUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
type ClerkEmailAddress = ClerkCurrentUser["emailAddresses"][number];

// Keep this fixture minimal: it only includes the Clerk fields our tests + the
// app code paths touch. We derive the field *types* from Clerk so nullability
// / nesting stays aligned with the installed SDK types.
type AuthUser = Pick<
  ClerkCurrentUser,
  "id" | "imageUrl" | "firstName" | "lastName"
> & {
  // Keep this fixture minimal: we only ever read `emailAddress` in app code/tests.
  emailAddresses: Array<Pick<ClerkEmailAddress, "emailAddress">>;
};

export const authUserFactory = Factory.define<AuthUser>(({ sequence }) => ({
  id: `user_${sequence}`,
  imageUrl: "https://img.example/u.png",
  firstName: "Ada",
  lastName: "Lovelace",
  emailAddresses: [{ emailAddress: "ada@example.com" }],
}));

export const rewindAuthUserFactory = () => {
  authUserFactory.rewindSequence();
};
