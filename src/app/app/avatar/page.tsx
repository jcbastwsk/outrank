import { redirect } from "next/navigation";

export default function AvatarRedirect() {
  redirect("/app/identity");
}
