import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET — list leaves
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pis = searchParams.get('pis');
  const month = parseInt(searchParams.get('month') || '0');
  const year = parseInt(searchParams.get('year') || '0');

  const where: Record<string, unknown> = {};
  if (pis) where.employeeId = pis;
  if (month && year) {
    where.startDate = { lte: new Date(year, month, 0) };
    where.endDate = { gte: new Date(year, month - 1, 1) };
  }

  const leaves = await prisma.leave.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: { employee: { select: { name: true, pis: true } } },
  });

  return NextResponse.json({ leaves });
}

// POST — create leave
export async function POST(req: NextRequest) {
  const body = await req.json();

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const leave = await prisma.leave.create({
    data: {
      id: `leave-${Date.now()}`,
      employeeId: body.employeeId,
      type: body.type,
      startDate,
      endDate,
      days,
      reason: body.reason || '',
      status: body.status || 'approved',
    },
  });

  // Create notification
  const emp = await prisma.employee.findUnique({ where: { pis: body.employeeId } });
  const typeLabels: Record<string, string> = {
    ferias: 'Férias', atestado: 'Atestado Médico',
    falta_justificada: 'Falta Justificada', licenca: 'Licença',
    folga_compensatoria: 'Folga Compensatória',
  };
  await prisma.notification.create({
    data: {
      id: `notif-leave-${Date.now()}`,
      type: 'leave_approved',
      title: `${typeLabels[body.type] || body.type} registrado`,
      message: `${emp?.name || body.employeeId} — ${days} dia(s) de ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`,
      severity: 'info',
      relatedId: leave.id,
    },
  });

  return NextResponse.json(leave);
}

// DELETE — remove leave
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

  await prisma.leave.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
