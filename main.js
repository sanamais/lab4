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

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/') {
    return send(res, 404, { error: 'Маршрут не знайдено' });
  }
  send(res, 200, { message: 'Сервер працює' });
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