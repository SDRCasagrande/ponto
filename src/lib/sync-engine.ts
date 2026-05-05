/**
 * Sync Engine — puxa marcações dos relógios ControlID automaticamente.
 * Roda como background job no servidor Next.js.
 */
import { prisma } from './db';
import { createDevice, connect, downloadAFD, getDeviceInfo } from './controlid';
import { AFDParser } from './afd-parser';

export async function syncClock(clockId: string): Promise<{ success: boolean; message: string; newPunches: number }> {
  const start = Date.now();
  const clock = await prisma.clock.findUnique({ where: { id: clockId } });
  if (!clock) return { success: false, message: 'Relógio não encontrado', newPunches: 0 };

  try {
    // 1. Conectar ao relógio
    const device = createDevice(clock.ip, clock.login, clock.password);
    device.port = clock.port;
    device.protocol = clock.protocol as 'https' | 'http';
    await connect(device);

    // 2. Atualizar info do equipamento
    const info = await getDeviceInfo(device);
    await prisma.clock.update({
      where: { id: clockId },
      data: { deviceName: info.name, serial: info.serial },
    });

    // 3. Baixar AFD
    const afdContent = await downloadAFD(device);

    // 4. Parsear
    const parser = new AFDParser();
    parser.parseContent(afdContent);

    // 5. Inserir marcações novas (upsert para evitar duplicatas)
    let newCount = 0;
    for (const punch of parser.punches) {
      try {
        await prisma.punch.create({
          data: {
            nsr: punch.nsr,
            pis: punch.pis,
            punchTime: punch.datetime,
            clockId: clock.id,
            source: 'sync',
          },
        });
        newCount++;
      } catch {
        // Duplicata (unique constraint) — ignora
      }
    }

    // 6. Upsert funcionários detectados
    for (const [pis, emp] of parser.employees) {
      await prisma.employee.upsert({
        where: { pis },
        create: { pis, name: emp.name },
        update: emp.name ? { name: emp.name } : {},
      });
    }

    // 7. Atualizar status do relógio
    await prisma.clock.update({
      where: { id: clockId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: '',
      },
    });

    // 8. Log
    const duration = Date.now() - start;
    await prisma.syncLog.create({
      data: {
        clockId: clock.id,
        clockName: clock.name,
        status: 'success',
        message: `${parser.punches.length} marcações encontradas, ${newCount} novas`,
        punchesFound: parser.punches.length,
        punchesNew: newCount,
        duration,
      },
    });

    return {
      success: true,
      message: `Sincronizado! ${newCount} novas marcações de ${parser.punches.length} total`,
      newPunches: newCount,
    };
  } catch (e) {
    const msg = (e as Error).message;
    const duration = Date.now() - start;

    await prisma.clock.update({
      where: { id: clockId },
      data: { lastSyncAt: new Date(), lastSyncStatus: 'error', lastSyncError: msg },
    });

    await prisma.syncLog.create({
      data: {
        clockId: clock.id,
        clockName: clock.name,
        status: 'error',
        message: msg,
        duration,
      },
    });

    return { success: false, message: msg, newPunches: 0 };
  }
}

/**
 * Sincroniza TODOS os relógios ativos.
 */
export async function syncAllClocks(): Promise<Array<{ clockId: string; name: string; result: Awaited<ReturnType<typeof syncClock>> }>> {
  const clocks = await prisma.clock.findMany({ where: { syncEnabled: true } });
  const results = [];

  for (const clock of clocks) {
    const result = await syncClock(clock.id);
    results.push({ clockId: clock.id, name: clock.name, result });
  }

  return results;
}
