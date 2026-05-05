import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET — list notifications
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  const where = unreadOnly ? { read: false } : {};
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({ where: { read: false } });

  return NextResponse.json({ notifications, unreadCount });
}

// POST — create notification (or mark as read)
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Mark as read
  if (body.action === 'markRead') {
    if (body.id) {
      await prisma.notification.update({ where: { id: body.id }, data: { read: true } });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
    }
    return NextResponse.json({ success: true });
  }

  // Create notification
  const notification = await prisma.notification.create({
    data: {
      id: `notif-${Date.now()}`,
      type: body.type || 'info',
      title: body.title || '',
      message: body.message || '',
      severity: body.severity || 'info',
      relatedId: body.relatedId || null,
    },
  });

  return NextResponse.json(notification);
}

// DELETE — clear old notifications
export async function DELETE() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await prisma.notification.deleteMany({
    where: { createdAt: { lt: thirtyDaysAgo }, read: true },
  });
  return NextResponse.json({ success: true });
}
