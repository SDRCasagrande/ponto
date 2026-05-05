import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  // Totals
  const totalEmployees = await prisma.employee.count({ where: { active: true } });
  const totalClocks = await prisma.clock.count();
  const totalPunches = await prisma.punch.count();

  // Today's punches
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayPunches = await prisma.punch.findMany({
    where: { punchTime: { gte: today, lt: tomorrow } },
    orderBy: { punchTime: 'desc' },
    take: 50,
  });

  // Who punched today
  const todayPisList = [...new Set(todayPunches.map(p => p.pis))];
  const punchedToday = todayPisList.length;

  // Last syncs
  const recentSyncs = await prisma.syncLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Clock statuses
  const clocks = await prisma.clock.findMany();

  // Enrich today punches with employee names
  const empMap = new Map<string, string>();
  if (todayPisList.length > 0) {
    const emps = await prisma.employee.findMany({ where: { pis: { in: todayPisList } } });
    emps.forEach(e => empMap.set(e.pis, e.name || `PIS ${e.pis}`));
  }

  const enrichedTodayPunches = todayPunches.map(p => ({
    ...p,
    employeeName: empMap.get(p.pis) || `PIS ${p.pis}`,
  }));

  // === CHART DATA: Last 7 days of punches ===
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    const count = await prisma.punch.count({
      where: { punchTime: { gte: d, lt: nextD } },
    });
    const unique = await prisma.punch.findMany({
      where: { punchTime: { gte: d, lt: nextD } },
      select: { pis: true },
      distinct: ['pis'],
    });
    last7.push({
      date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
      punches: count,
      employees: unique.length,
    });
  }

  // === Monthly summary (current month) ===
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const allEmps = await prisma.employee.findMany({ where: { active: true } });
  let totalWorkedDays = 0;
  let totalAbsentDays = 0;
  let totalLateDays = 0;
  
  for (const emp of allEmps) {
    const empPunches = await prisma.punch.findMany({
      where: {
        pis: emp.pis,
        punchTime: { gte: monthStart, lte: new Date(monthEnd.getTime() + 86400000) },
      },
      select: { punchTime: true },
    });
    
    const daysWithPunches = new Set(
      empPunches.map(p => p.punchTime.toISOString().substring(0, 10))
    );
    totalWorkedDays += daysWithPunches.size;
    
    // Count workdays without punches
    const current = new Date(monthStart);
    while (current <= today && current <= monthEnd) {
      const dow = current.getDay();
      if (dow >= 1 && dow <= 5) { // Mon-Fri
        const key = current.toISOString().substring(0, 10);
        if (!daysWithPunches.has(key)) totalAbsentDays++;
      }
      current.setDate(current.getDate() + 1);
    }
  }

  return NextResponse.json({
    totalEmployees, totalClocks, totalPunches,
    punchedToday, totalActive: totalEmployees,
    todayPunches: enrichedTodayPunches,
    recentSyncs, clocks,
    // New chart data
    last7Days: last7,
    monthlySummary: {
      workedDays: totalWorkedDays,
      absentDays: totalAbsentDays,
      lateDays: totalLateDays,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    },
  });
}
