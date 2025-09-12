// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validations/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const data = await req.json();
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await createSessionCookie({ sub: user.id, username: user.username });

  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
