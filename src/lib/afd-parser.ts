/**
 * Parser de arquivos AFD — Portaria 671 REP-C e ControlID ISO.
 * Portado do Python original para TypeScript.
 */

export interface ParsedPunch {
  datetime: Date;
  nsr: string;
  pis: string;
}

export interface ParsedEmployee { pis: string; name: string; }
export interface ParsedCompany { name: string; cnpj: string; }

const ISO_DT = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{4})/;

export class AFDParser {
  punches: ParsedPunch[] = [];
  employees = new Map<string, ParsedEmployee>();
  company: ParsedCompany = { name: '', cnpj: '' };
  errors: string[] = [];
  totalLines = 0;
  parsedLines = 0;
  fmt = 'unknown';

  parseContent(content: string) {
    this.punches = []; this.employees = new Map();
    this.company = { name: '', cnpj: '' };
    this.errors = []; this.totalLines = 0; this.parsedLines = 0; this.fmt = 'unknown';
    const lines = content.split(/\r?\n/);
    this.totalLines = lines.length;
    this._detectFmt(lines);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (!l) continue;
      try { this._parseLine(l); this.parsedLines++; }
      catch (e) { this.errors.push(`L${i + 1}: ${(e as Error).message}`); }
    }
    this.punches.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
    return { employees: this.employees, company: this.company };
  }

  private _detectFmt(lines: string[]) {
    if (lines[0]?.trim().toUpperCase().match(/REP[_-]C/)) { this.fmt = 'portaria671'; return; }
    for (const l of lines) {
      const t = l.trim();
      if (t.length < 20 || t[9] !== '3') continue;
      this.fmt = ISO_DT.test(t.substring(10, 35)) ? 'controlid_iso' : 'portaria671';
      return;
    }
    this.fmt = 'portaria671';
  }

  private _parseLine(l: string) {
    if (l.length < 10 || l.startsWith('999999999') || (l.includes('==') && l.length < 120)) return;
    const nsr = l.substring(0, 9).trim();
    const rt = l[9];
    if (rt === '1') this._hdr(l);
    else if (rt === '3') this._punch(l, nsr);
    else if (rt === '5') this._emp(l);
  }

  private _hdr(l: string) {
    try {
      const iso = this.fmt === 'controlid_iso';
      const cnpjRaw = l.substring(iso ? 10 : 11, iso ? 24 : 25).trim();
      let razao = l.length > (iso ? 39 : 37) ? l.substring(iso ? 39 : 37, iso ? 189 : 187).trim() : '';
      if (!razao && !iso) {
        const m = l.substring(25).match(/([A-ZÀ-Ú][A-ZÀ-Ú\s.\-&]{3,})/);
        if (m) razao = m[1].trim();
      }
      if (cnpjRaw) {
        const d = cnpjRaw.replace(/\D/g, '').substring(0, 14);
        if (d.length === 14) this.company.cnpj = `${d.substring(0,2)}.${d.substring(2,5)}.${d.substring(5,8)}/${d.substring(8,12)}-${d.substring(12,14)}`;
      }
      if (razao) this.company.name = razao;
    } catch { /* skip */ }
  }

  private _punch(l: string, nsr: string) {
    let day: number, mo: number, yr: number, hr: number, mn: number, pis: string;
    if (this.fmt === 'controlid_iso') {
      const m = l.substring(10, 34).match(ISO_DT);
      if (!m) return;
      yr = +m[1]; mo = +m[2]; day = +m[3]; hr = +m[4]; mn = +m[5];
      pis = l.substring(34, 46).trim();
    } else {
      const ds = l.substring(10, 18), ts = l.substring(18, 22);
      pis = l.substring(22, 34).trim();
      day = +ds.substring(0, 2); mo = +ds.substring(2, 4);
      yr = +ds.substring(4, 8); hr = +ts.substring(0, 2); mn = +ts.substring(2, 4);
    }
    if (!pis || day < 1 || day > 31 || mo < 1 || mo > 12 || yr < 2000 || yr > 2100) return;
    if (hr < 0 || hr > 23 || mn < 0 || mn > 59) return;
    this.punches.push({ datetime: new Date(yr, mo - 1, day, hr, mn), nsr, pis });
    if (!this.employees.has(pis)) this.employees.set(pis, { pis, name: '' });
  }

  private _emp(l: string) {
    const iso = this.fmt === 'controlid_iso';
    const pis = l.substring(iso ? 35 : 23, iso ? 47 : 35).trim();
    const name = l.length > (iso ? 47 : 35) ? l.substring(iso ? 47 : 35, iso ? 99 : 87).trim() : '';
    if (!pis) return;
    if (!this.employees.has(pis)) this.employees.set(pis, { pis, name: '' });
    if (name) this.employees.get(pis)!.name = name;
  }

  getMonthOptions() {
    const s = new Set<string>();
    for (const p of this.punches) s.add(`${p.datetime.getMonth()+1}-${p.datetime.getFullYear()}`);
    return Array.from(s).map(x => { const [m, y] = x.split('-'); return { month: +m, year: +y }; })
      .sort((a, b) => a.year - b.year || a.month - b.month);
  }

  getSummary() {
    const dates = this.punches.map(p => p.datetime.getTime());
    const emps: Record<string, string> = {};
    this.employees.forEach((e, k) => { emps[k] = e.name || `PIS ${k}`; });
    return {
      totalLines: this.totalLines, parsedLines: this.parsedLines,
      totalPunches: this.punches.length, totalEmployees: this.employees.size,
      dateStart: dates.length ? new Date(Math.min(...dates)) : null,
      dateEnd: dates.length ? new Date(Math.max(...dates)) : null,
      companyName: this.company.name, companyCnpj: this.company.cnpj,
      errors: this.errors.length, monthsAvailable: this.getMonthOptions(),
      format: this.fmt, employees: emps,
    };
  }
}
