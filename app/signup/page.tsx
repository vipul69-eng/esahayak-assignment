// app/signup/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const r = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) r.push("/buyers");
    else setErr((await res.json()).error ?? "Signup failed");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      aria-describedby="form-error"
    >
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>
      {err && (
        <p id="form-error" role="alert">
          {err}
        </p>
      )}
      <button type="submit">Create account</button>
    </form>
  );
}
