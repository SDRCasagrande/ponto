/**
 * Calculador de jornada CLT — horas extras, faltas, atrasos.
 */

export interface ScheduleConfig {
  type: string; // 'padrao' | '5x2' | '6x1' | '12x36' | 'parcial_30' | 'parcial_26'
  entryTime: string; // "08:00"
  exitTime: string;  // "18:00"
  breakDuration: number; // minutos
  toleranceMinutes: number;
  dailyHours: number;
  saturdayHours: number;
  workdays: number[]; // 0=seg, 6=dom
}

export interface WorkDay {
  date: string; // ISO date string
  weekday: number; // 0=seg, 6=dom
  dayName: string;
  punches: Array<{ time: string; datetime: string }>;
  expectedHours: number;
  workedHours: number;
  overtimeHours: number;
  deficitHours: number;
  isLate: boolean;
  lateMinutes: number;
  isAbsent: boolean;
  isIncomplete: boolean;
  isWorkday: boolean;
  observation: string;
}

export interface EmployeeReport {
  pis: string;
  name: string;
  workdays: WorkDay[];
  totalWorkedHours: number;
  totalExpectedHours: number;
  totalOvertimeHours: number;
  totalDeficitHours: number;
  totalLateDays: number;
  totalLateMinutes: number;
  totalAbsentDays: number;
  totalIncompleteDays: number;
  bankBalance: number;
}

export const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const defaultSchedule: ScheduleConfig = {
  type: '6x1', entryTime: '08:00', exitTime: '18:00',
  breakDuration: 120, toleranceMinutes: 10,
  dailyHours: 8.0, saturdayHours: 4.0,
  workdays: [0, 1, 2, 3, 4, 5],
};

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function isWorkday(weekday: number, schedule: ScheduleConfig): boolean {
  return schedule.workdays.includes(weekday);
}

function expectedHours(weekday: number, schedule: ScheduleConfig): number {
  if (!isWorkday(weekday, schedule)) return 0;
  if (weekday === 5) return schedule.saturdayHours;
  return schedule.dailyHours;
}

function calcWorkedHours(punches: Date[]): number {
  if (punches.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < punches.length - 1; i += 2) {
    const diff = (punches[i + 1].getTime() - punches[i].getTime()) / 60000;
    if (diff > 0) total += diff;
  }
  return Math.max(0, total / 60);
}

/**
 * Calcula relatório mensal de um funcionário.
 */
export function calculateEmployee(
  pis: string,
  name: string,
  punches: Array<{ punchTime: Date }>,
  month: number,
  year: number,
  schedule: ScheduleConfig,
  startDate?: Date,
  endDate?: Date
): EmployeeReport {
  const daysInMonth = new Date(year, month, 0).getDate();
  const pStart = startDate || new Date(year, month - 1, 1);
  const pEnd = endDate || new Date(year, month - 1, daysInMonth);

  // Group punches by day
  const byDay = new Map<string, Date[]>();
  for (const p of punches) {
    const d = p.punchTime;
    if (d >= pStart && d <= new Date(pEnd.getTime() + 86400000)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(d);
    }
  }
  // Sort punches within each day
  for (const [, arr] of byDay) arr.sort((a, b) => a.getTime() - b.getTime());

  const workdays: WorkDay[] = [];
  const current = new Date(pStart);

  while (current <= pEnd) {
    const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const weekday = (current.getDay() + 6) % 7; // JS: 0=dom → convert to 0=seg
    const isWd = isWorkday(weekday, schedule);
    const expected = expectedHours(weekday, schedule);
    const dayPunches = byDay.get(dateKey) || [];

    const wd: WorkDay = {
      date: dateKey, weekday, dayName: DAYS[weekday],
      punches: dayPunches.map(p => ({
        time: `${String(p.getHours()).padStart(2, '0')}:${String(p.getMinutes()).padStart(2, '0')}`,
        datetime: p.toISOString(),
      })),
      expectedHours: expected, workedHours: 0, overtimeHours: 0,
      deficitHours: 0, isLate: false, lateMinutes: 0,
      isAbsent: false, isIncomplete: false, isWorkday: isWd, observation: '',
    };

    if (dayPunches.length === 0) {
      if (isWd) { wd.isAbsent = true; wd.deficitHours = expected; wd.observation = 'Sem marcações'; }
    } else if (dayPunches.length === 1) {
      wd.isIncomplete = true; wd.observation = 'Marcação incompleta (1 batida)';
      if (isWd) { wd.isAbsent = true; wd.deficitHours = expected; }
    } else {
      if (dayPunches.length % 2 !== 0) { wd.isIncomplete = true; wd.observation = `Marcação ímpar (${dayPunches.length} batidas)`; }
      if (dayPunches.length === 2 && isWd && expected > 6) wd.observation = 'Jornada contínua (sem intervalo)';

      const worked = calcWorkedHours(dayPunches);
      wd.workedHours = worked;

      if (!isWd) {
        wd.overtimeHours = worked;
        if (!wd.observation) wd.observation = 'Trabalho em dia de folga';
      } else {
        // Atraso
        const entryMin = dayPunches[0].getHours() * 60 + dayPunches[0].getMinutes();
        const expectedEntry = parseTime(schedule.entryTime);
        const late = entryMin - expectedEntry;
        if (late > schedule.toleranceMinutes) { wd.isLate = true; wd.lateMinutes = late; }
        // Extras / Déficit
        const tol = schedule.toleranceMinutes / 60;
        if (worked > expected + tol) {
          wd.overtimeHours = Math.min(worked - expected, 2.0);
        } else if (worked < expected - tol) {
          wd.deficitHours = expected - worked;
        }
      }
    }

    workdays.push(wd);
    current.setDate(current.getDate() + 1);
  }

  const totalWorked = workdays.reduce((s, w) => s + w.workedHours, 0);
  const totalExpected = workdays.reduce((s, w) => s + w.expectedHours, 0);
  const totalOvertime = workdays.reduce((s, w) => s + w.overtimeHours, 0);
  const totalDeficit = workdays.reduce((s, w) => s + w.deficitHours, 0);

  return {
    pis, name, workdays, totalWorkedHours: totalWorked, totalExpectedHours: totalExpected,
    totalOvertimeHours: totalOvertime, totalDeficitHours: totalDeficit,
    totalLateDays: workdays.filter(w => w.isLate).length,
    totalLateMinutes: workdays.reduce((s, w) => s + w.lateMinutes, 0),
    totalAbsentDays: workdays.filter(w => w.isAbsent).length,
    totalIncompleteDays: workdays.filter(w => w.isIncomplete).length,
    bankBalance: totalOvertime - totalDeficit,
  };
}

export function formatHours(h: number): string {
  const hrs = Math.floor(Math.abs(h));
  const mins = Math.round((Math.abs(h) - hrs) * 60);
  return `${hrs}h${String(mins).padStart(2, '0')}`;
}
