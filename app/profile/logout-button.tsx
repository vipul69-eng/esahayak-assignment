// app/profile/logout-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setLoading(false);
    router.push("/login");
  }

  return (
    <button onClick={onLogout} disabled={loading} className="btn">
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
