import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createDevice, testConnection } from '@/lib/controlid';

export async function GET() {
  const clocks = await prisma.clock.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(clocks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, ip, port, login, password, protocol } = body;

  if (!name || !ip) {
    return NextResponse.json({ error: 'Nome e IP são obrigatórios' }, { status: 400 });
  }

  // Testa conexão antes de salvar
  const device = createDevice(ip, login || 'admin', password || 'admin');
  device.port = port || 443;
  device.protocol = protocol || 'https';
  const test = await testConnection(device);

  const clock = await prisma.clock.create({
    data: {
      name,
      ip,
      port: port || 443,
      protocol: protocol || 'https',
      login: login || 'admin',
      password: password || 'admin',
      deviceName: device.deviceName,
      serial: device.serial,
      lastSyncStatus: test.success ? 'connected' : 'error',
      lastSyncError: test.success ? '' : test.message,
    },
  });

  return NextResponse.json({ clock, connectionTest: test });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  await prisma.clock.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
