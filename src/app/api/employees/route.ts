import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const employees = await prisma.employee.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  // Enrich with punch count
  const enriched = await Promise.all(employees.map(async (emp) => {
    const punchCount = await prisma.punch.count({ where: { pis: emp.pis } });
    const lastPunch = await prisma.punch.findFirst({
      where: { pis: emp.pis },
      orderBy: { punchTime: 'desc' },
    });
    return { ...emp, punchCount, lastPunch: lastPunch?.punchTime || null };
  }));

  return NextResponse.json(enriched);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { pis, name, cargo, department } = body;
  if (!pis) return NextResponse.json({ error: 'PIS obrigatório' }, { status: 400 });

  const updated = await prisma.employee.update({
    where: { pis },
    data: { ...(name && { name }), ...(cargo !== undefined && { cargo }), ...(department !== undefined && { department }) },
  });
  return NextResponse.json(updated);
}
