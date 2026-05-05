/**
 * Cliente API para relógios de ponto ControlID.
 * Conecta via rede local (HTTPS ou HTTP) para puxar o AFD diretamente.
 * Portado do Python original para TypeScript.
 */

import https from 'https';
import http from 'http';

export interface ControlIDDevice {
  ip: string;
  port: number;
  login: string;
  password: string;
  protocol: 'https' | 'http';
  session: string;
  deviceName: string;
  serial: string;
}

export function createDevice(ip: string, login = 'admin', password = 'admin'): ControlIDDevice {
  return {
    ip,
    port: 443,
    login,
    password,
    protocol: 'https',
    session: '',
    deviceName: '',
    serial: '',
  };
}

// Agente HTTPS que ignora certificados auto-assinados do relógio
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

async function request(device: ControlIDDevice, endpoint: string, data?: Record<string, unknown>, params = ''): Promise<Record<string, unknown>> {
  const url = `${device.protocol}://${device.ip}:${device.port}/${endpoint}${params ? `?${params}` : ''}`;
  const body = JSON.stringify(data ?? {});

  return new Promise((resolve, reject) => {
    const lib = device.protocol === 'https' ? https : http;
    const req = lib.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
      timeout: 10000,
      ...(device.protocol === 'https' ? { agent: insecureAgent } : {}),
    }, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (!responseData.trim()) return resolve({});
        try {
          resolve(JSON.parse(responseData));
        } catch {
          resolve({ raw: responseData });
        }
      });
    });

    req.on('error', (e) => reject(new Error(`Não foi possível conectar ao relógio (${device.ip}): ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout conectando ao relógio (${device.ip})`)); });
    req.write(body);
    req.end();
  });
}

async function requestRaw(device: ControlIDDevice, endpoint: string, data?: Record<string, unknown>, params = ''): Promise<string> {
  const url = `${device.protocol}://${device.ip}:${device.port}/${endpoint}${params ? `?${params}` : ''}`;
  const body = JSON.stringify(data ?? {});

  return new Promise((resolve, reject) => {
    const lib = device.protocol === 'https' ? https : http;
    const req = lib.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
      timeout: 30000,
      ...(device.protocol === 'https' ? { agent: insecureAgent } : {}),
    }, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => resolve(responseData));
    });

    req.on('error', (e) => reject(new Error(`Não foi possível conectar ao relógio (${device.ip}): ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function loginRequest(device: ControlIDDevice, contentType: 'json' | 'form' = 'json'): Promise<Record<string, unknown>> {
  const url = `${device.protocol}://${device.ip}:${device.port}/login.fcgi`;
  const loginData = { login: device.login, password: device.password };

  let body: string;
  let ctHeader: string;
  if (contentType === 'form') {
    body = new URLSearchParams(loginData).toString();
    ctHeader = 'application/x-www-form-urlencoded';
  } else {
    body = JSON.stringify(loginData);
    ctHeader = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const lib = device.protocol === 'https' ? https : http;
    const req = lib.request(url, {
      method: 'POST',
      headers: { 'Content-Type': ctHeader, 'Content-Length': Buffer.byteLength(body).toString() },
      timeout: 10000,
      ...(device.protocol === 'https' ? { agent: insecureAgent } : {}),
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (!data.trim()) return resolve({});
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    });
    req.on('error', (e) => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

/**
 * Auto-detecta protocolo e porta do relógio.
 */
async function autoDetectProtocol(device: ControlIDDevice): Promise<{ success: boolean; message: string }> {
  const attempts: Array<{ proto: 'https' | 'http'; port: number }> = [
    { proto: 'https', port: 443 },
    { proto: 'http', port: 80 },
    { proto: 'https', port: 4370 },
    { proto: 'http', port: 4370 },
  ];

  for (const { proto, port } of attempts) {
    device.protocol = proto;
    device.port = port;
    for (const ct of ['json', 'form'] as const) {
      try {
        const result = await loginRequest(device, ct);
        if ('session' in result) {
          device.session = result.session as string;
          return { success: true, message: `Conectado via ${proto.toUpperCase()}:${port} (${ct})` };
        }
      } catch {
        // tenta próximo
      }
    }
  }
  return { success: false, message: 'Nenhum protocolo funcionou' };
}

/**
 * Autentica no relógio e obtém sessão.
 */
export async function connect(device: ControlIDDevice): Promise<boolean> {
  // 1) JSON
  try {
    const result = await loginRequest(device, 'json');
    if ('session' in result) {
      device.session = result.session as string;
      return true;
    }
  } catch { /* try next */ }

  // 2) form-urlencoded (firmware antigo)
  try {
    const result = await loginRequest(device, 'form');
    if ('session' in result) {
      device.session = result.session as string;
      return true;
    }
  } catch { /* try next */ }

  // 3) Auto-detect
  const { success } = await autoDetectProtocol(device);
  if (success) return true;

  throw new Error(
    'Não foi possível conectar ao relógio.\n' +
    'Verifique:\n• IP correto\n• Usuário e senha da API\n• Relógio ligado e na mesma rede'
  );
}

/**
 * Obtém informações do equipamento.
 */
export async function getDeviceInfo(device: ControlIDDevice): Promise<{ name: string; serial: string }> {
  if (!device.session) throw new Error('Não autenticado');
  try {
    const result = await request(device, 'system_information.fcgi', undefined, `session=${device.session}`);
    device.deviceName = (result.name as string) || '';
    device.serial = (result.serial as string) || '';
    return { name: device.deviceName, serial: device.serial };
  } catch {
    return { name: 'ControlID', serial: 'N/A' };
  }
}

/**
 * Baixa o AFD do relógio como string de texto.
 */
export async function downloadAFD(device: ControlIDDevice, mode = '671'): Promise<string> {
  if (!device.session) throw new Error('Não autenticado');
  let params = `session=${device.session}`;
  if (mode) params += `&mode=${mode}`;

  const content = await requestRaw(device, 'get_afd.fcgi', undefined, params);
  if (!content || content.trim().length < 10) {
    throw new Error('AFD vazio — o relógio pode não ter marcações.');
  }
  return content;
}

/**
 * Testa a conexão com o relógio.
 */
export async function testConnection(device: ControlIDDevice): Promise<{ success: boolean; message: string }> {
  try {
    await connect(device);
    const info = await getDeviceInfo(device);
    return {
      success: true,
      message: `Conectado! (${device.protocol.toUpperCase()}:${device.port})\nEquipamento: ${info.name}\nSerial: ${info.serial}`,
    };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}
