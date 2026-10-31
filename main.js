import { Command } from 'commander';

const program = new Command();
program
  .helpOption('--help', 'показати довідку') 
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