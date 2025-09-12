// app/profile/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "./logout-button";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>
      <div className="rounded border p-4">
        <p>
          <strong>Username:</strong> {session.username}
        </p>
      </div>
      <LogoutButton />
    </div>
  );
}
