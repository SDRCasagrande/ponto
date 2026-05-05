import { NextRequest, NextResponse } from 'next/server';
import { createDevice, testConnection } from '@/lib/controlid';

export async function POST(req: NextRequest) {
  const { ip, port, login, password, protocol } = await req.json();
  if (!ip) return NextResponse.json({ error: 'IP obrigatório' }, { status: 400 });

  const device = createDevice(ip, login || 'admin', password || 'admin');
  device.port = port || 443;
  device.protocol = protocol || 'https';
  const result = await testConnection(device);
  return NextResponse.json(result);
}
