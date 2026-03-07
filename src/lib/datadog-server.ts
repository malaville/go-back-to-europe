// Server-side Datadog log forwarding via HTTP intake
// Works on Vercel Hobby (no log drain needed)

const DD_API_KEY = process.env.DD_API_KEY ?? '';
const DD_INTAKE = 'https://http-intake.logs.datadoghq.eu/api/v2/logs';

type LogLevel = 'info' | 'warn' | 'error';

type LogEntry = {
  level: LogLevel;
  message: string;
  service?: string;
  [key: string]: unknown;
};

const buffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (buffer.length === 0 || !DD_API_KEY) return;

  const batch = buffer.splice(0, buffer.length);
  const payload = batch.map(({ level, message, service, ...attrs }) => ({
    ddsource: 'nodejs',
    ddtags: 'env:production',
    hostname: 'vercel',
    service: service ?? 'skipthegulf-api',
    status: level,
    message,
    ...attrs,
  }));

  try {
    await fetch(DD_INTAKE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DD_API_KEY,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent fail — don't break the app over logging
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 1000);
}

export function ddlog(level: LogLevel, message: string, attrs?: Record<string, unknown>) {
  if (!DD_API_KEY) return;
  buffer.push({ level, message, ...attrs });
  scheduleFlush();
}

/** Call at the end of an API route to ensure logs are sent before the response completes */
export async function ddflush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await flush();
}
