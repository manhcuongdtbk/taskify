import { SignUp } from "@clerk/nextjs";

export default function SignUpPage({}: PageProps<"/sign-up/[[...sign-up]]">) {
  return <SignUp />;
}
