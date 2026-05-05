import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateEmployee, defaultSchedule } from '@/lib/calculator';
import type { ScheduleConfig } from '@/lib/calculator';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const pis = searchParams.get('pis'); // Optional: specific employee

  // Load config
  const config = await prisma.config.findUnique({ where: { id: 'global' } });
  const schedule: ScheduleConfig = config ? {
    type: config.scheduleType,
    entryTime: config.entryTime,
    exitTime: config.exitTime,
    breakDuration: config.breakDuration,
    toleranceMinutes: config.toleranceMinutes,
    dailyHours: config.dailyHours,
    saturdayHours: config.saturdayHours,
    workdays: config.workdays.split(',').map(Number),
  } : defaultSchedule;

  // Date range
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Get employees
  const where = pis ? { pis } : { active: true };
  const employees = await prisma.employee.findMany({ where, orderBy: { name: 'asc' } });

  // Calculate for each
  const reports = await Promise.all(employees.map(async (emp) => {
    const punches = await prisma.punch.findMany({
      where: {
        pis: emp.pis,
        punchTime: { gte: startDate, lte: new Date(endDate.getTime() + 86400000) },
      },
      orderBy: { punchTime: 'asc' },
    });

    return calculateEmployee(
      emp.pis, emp.name || `PIS ${emp.pis}`,
      punches, month, year, schedule
    );
  }));

  return NextResponse.json({
    month, year, schedule,
    company: config ? { name: config.companyName, cnpj: config.companyCnpj } : { name: '', cnpj: '' },
    employees: reports,
  });
}
