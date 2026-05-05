import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AFDParser } from '@/lib/afd-parser';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const content = await file.text();
    const parser = new AFDParser();
    parser.parseContent(content);
    const summary = parser.getSummary();

    // Upsert employees
    let employeesCreated = 0;
    for (const [pis, emp] of parser.employees) {
      try {
        await prisma.employee.upsert({
          where: { pis },
          create: { pis, name: emp.name || `Funcionário ${pis}`, updatedAt: new Date() },
          update: emp.name ? { name: emp.name, updatedAt: new Date() } : { updatedAt: new Date() },
        });
        employeesCreated++;
      } catch { /* skip duplicates */ }
    }

    // Update company info if found
    if (summary.companyName || summary.companyCnpj) {
      try {
        await prisma.config.upsert({
          where: { id: 'global' },
          create: {
            id: 'global',
            companyName: summary.companyName || '',
            companyCnpj: summary.companyCnpj || '',
            updatedAt: new Date(),
          },
          update: {
            ...(summary.companyName ? { companyName: summary.companyName } : {}),
            ...(summary.companyCnpj ? { companyCnpj: summary.companyCnpj } : {}),
            updatedAt: new Date(),
          },
        });
      } catch { /* ignore */ }
    }

    // Insert punches (skip duplicates)
    let punchesInserted = 0;
    let punchesSkipped = 0;
    for (const punch of parser.punches) {
      try {
        await prisma.punch.create({
          data: {
            nsr: punch.nsr,
            pis: punch.pis,
            punchTime: punch.datetime,
            source: 'file',
            employeeId: punch.pis,
          },
        });
        punchesInserted++;
      } catch {
        punchesSkipped++; // Duplicate
      }
    }

    return NextResponse.json({
      success: true,
      format: summary.format,
      totalLines: summary.totalLines,
      parsedLines: summary.parsedLines,
      totalPunches: summary.totalPunches,
      punchesInserted,
      punchesSkipped,
      employeesFound: summary.totalEmployees,
      employeesCreated,
      companyName: summary.companyName,
      companyCnpj: summary.companyCnpj,
      dateStart: summary.dateStart,
      dateEnd: summary.dateEnd,
      errors: summary.errors,
    });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: 'Erro ao importar arquivo' }, { status: 500 });
  }
}
