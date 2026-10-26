import { redirect } from "next/navigation";

/** Setup moved to /owner */
export default function SetupRedirect() {
  redirect("/owner");
}
