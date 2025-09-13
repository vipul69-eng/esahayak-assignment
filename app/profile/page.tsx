import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import LogoutButton from "./logout-button";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const uname = session.username ?? "User";

  return (
    <div className="min-h-[calc(100dvh)] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-col items-center text-center gap-2">
          <Avatar className="size-16">
            <AvatarFallback>{initials(uname)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>Account details and session info.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 place-items-center">
          <div className="grid grid-cols-1 gap- place-items-center">
            <div className="rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">{uname}</p>
            </div>
            {/* Add more profile fields here if needed */}
          </div>

          {/* Actions */}
          <div className="pt-2 self-center">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
