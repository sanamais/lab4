import http from 'node:http';
import fs from 'node:fs';
import { Command } from 'commander';

const program = new Command();
program
  .helpOption('--help', 'показати довідку') // звільняємо -h для --host
  .requiredOption('-i, --input <path>', 'шлях до файлу даних')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .option('-o, --output <path>', 'файл для останньої відповіді');
program.parse();
const { input, host, port: portRaw, output } = program.opts();

const port = Number(portRaw);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('Invalid port: expected integer 0-65535');
  process.exit(1);
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseNdjson(text) {
  const records = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    records.push(JSON.parse(line)); 
  }
  return records;
}

function buildResult(records) {
  const result = [];
  for (const r of records) {
    result.push({
      air_time: toNumber(r.AIR_TIME),
      distance: toNumber(r.DISTANCE),
    });
  }
  return { status: 200, body: result };
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/') {
      return send(res, 404, { error: 'Маршрут не знайдено' });
    }
    fs.readFile(input, 'utf8', (err, text) => {
      if (err) {
        console.error('Помилка читання:', err.message);
        return send(res, 500, { error: 'Файл даних відсутній або недоступний' });
      }
      try {
        const records = parseNdjson(text);
        const { status, body } = buildResult(records);
        send(res, status, body);
      } catch (e) {
        console.error('Помилка обробки:', e.message);
        send(res, 500, { error: 'Файл даних пошкоджений' });
      }
    });
  } catch (e) {
    console.error('Неочікувана помилка:', e.message);
    send(res, 500, { error: 'Внутрішня помилка сервера' });
  }
});

server.on('error', (e) => {
  console.error('Помилка сервера:', e.message);
  process.exit(1);
});

fs.access(input, fs.constants.F_OK, (err) => {
  if (err) {
    console.error('Cannot find input file');
    process.exit(1);
  }
  server.listen(port, host, () => {
    console.log(`Сервер запущено: http://${host}:${port}`);
  });
});