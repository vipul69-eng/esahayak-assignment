// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/validations/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const data = await req.json();
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { username, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hash },
    select: { id: true, username: true, createdAt: true },
  });

  await createSessionCookie({ sub: user.id, username: user.username });

  return NextResponse.json({ user });
}
