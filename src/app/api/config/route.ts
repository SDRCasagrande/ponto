import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  let config = await prisma.config.findUnique({ where: { id: 'global' } });
  if (!config) {
    config = await prisma.config.create({
      data: { id: 'global' },
    });
  }
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const config = await prisma.config.upsert({
    where: { id: 'global' },
    create: { id: 'global', ...body },
    update: body,
  });
  return NextResponse.json(config);
}
