import { SignIn } from "@clerk/nextjs";

export default function SignInPage({}: PageProps<"/sign-in/[[...sign-in]]">) {
  return <SignIn />;
}
