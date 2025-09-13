import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/validations/auth";
import { PrismaClient, Role } from "@prisma/client";
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

  const { username, password, role } = parsed.data as {
    username: string;
    password: string;
    role?: Role;
  };

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(password, 10);
  // Only allow explicit role if the signup flow supports it; otherwise default to USER
  const assignedRole: Role = role && role === "ADMIN" ? "ADMIN" : "USER";

  const user = await prisma.user.create({
    data: { username, password: hash, role: assignedRole },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  // Include role in the session cookie payload
  await createSessionCookie({
    sub: user.id,
    username: user.username,
    role: user.role as "USER" | "ADMIN",
  });

  return NextResponse.json({ user });
}
