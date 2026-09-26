import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const addresses = [
  ...new Set(
    Object.values(networkInterfaces()).flatMap((interfaces) =>
      (interfaces ?? [])
        .filter((entry) => entry.family === 'IPv4' && !entry.internal)
        .map((entry) => entry.address),
    ),
  ),
];
// SSR must accept the LAN addresses printed below, not just localhost.
const allowedHosts = ['localhost', '127.0.0.1', '[::1]', ...addresses];
const root = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url));

console.log('Abra no celular, conectado à mesma rede:');
for (const address of addresses) console.log(`  http://${address}:4200`);
if (!addresses.length)
  console.log('Nenhum IPv4 de rede encontrado. Confira sua conexão Wi-Fi ou Ethernet.');

const server = spawn(process.execPath, [cli, 'serve', '--host', '0.0.0.0', '--port', '4200'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NG_ALLOWED_HOSTS: allowedHosts.join(',') },
});
// Stop the Angular child process when the host stops this launcher.
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
