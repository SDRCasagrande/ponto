import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// GET — list users
export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ users });
}

// POST — create user
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
  }

  const hash = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: {
      id: `user-${Date.now()}`,
      email: body.email,
      name: body.name || '',
      password: hash,
      role: body.role || 'operator',
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}

// PUT — update user
export async function PUT(req: NextRequest) {
  const body = await req.json();
  
  if (!body.id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) data.role = body.role;
  if (body.active !== undefined) data.active = body.active;
  if (body.password) data.password = await hashPassword(body.password);

  const user = await prisma.user.update({
    where: { id: body.id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });

  return NextResponse.json(user);
}

// DELETE — delete user
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
