import { redirect } from "next/navigation";

// No landing page yet: /dashboard sends visitors without a session to /login.
export default function Home() {
  redirect("/dashboard");
}
