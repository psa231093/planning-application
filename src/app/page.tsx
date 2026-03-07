import { redirect } from "next/navigation";

export default function HomePage() {
  // Skip auth check for development preview
  redirect("/register");
}
