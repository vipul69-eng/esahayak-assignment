import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={onLogout}
      disabled={loading}
      variant="destructive"
      className="w-full sm:w-auto"
    >
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
