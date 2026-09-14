const fs = require('node:fs/promises');
const path = require('node:path');

async function build() {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'dist');
  const workerDir = path.join(output, '_worker.js');
  await fs.mkdir(output, { recursive: true });
  await fs.cp(path.join(root, 'public'), output, { recursive: true });
  for (const file of await fs.readdir(path.join(root, 'public', 'pages'))) {
    if (file.endsWith('.html')) await fs.copyFile(path.join(root, 'public', 'pages', file), path.join(output, file));
  }

  // Compile the existing CommonJS API to an ES module without duplicating its logic.
  let server = await fs.readFile(path.join(root, 'server.js'), 'utf8');
  server = server.slice(0, server.indexOf('if (require.main === module) {'));
  server = server.replace(/const (\{[^\n]+\}|\w+) = require\("(node:[^"]+)"\);/g,
    (_, binding, specifier) => `import ${binding.startsWith('{') ? binding : '* as ' + binding} from '${specifier}';`);
  server = server.replace('const ROOT_DIR = __dirname;', "const ROOT_DIR = '/';");
  server = server.replace('loadEnvFile(path.join(ROOT_DIR, ".env"));', '');
  server = server.replaceAll('process.env', 'cloudflareEnv');
  server = "import { env as cloudflareEnv } from 'cloudflare:workers';\n" + server;
  server += '\nexport { handleApi, runWithRuntime, syncNewsFromSources };\n';

  await fs.mkdir(workerDir, { recursive: true });
  await fs.writeFile(path.join(workerDir, 'server.mjs'), server, 'utf8');
  await fs.copyFile(path.join(root, 'cloudflare', 'worker.mjs'), path.join(workerDir, 'index.js'));
  await fs.copyFile(path.join(root, 'cloudflare', 'storage.mjs'), path.join(workerDir, 'storage.mjs'));
  const seed = JSON.parse(await fs.readFile(path.join(root, 'data', 'db.json'), 'utf8'));
  seed.users = [];
  seed.sessions = [];
  seed.subscribers = [];
  seed.newsSync = { lastAttemptAt: new Date().toISOString() };
  await fs.writeFile(path.join(workerDir, 'seed.json'), JSON.stringify(seed), 'utf8');
  await fs.writeFile(path.join(output, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }), 'utf8');
  await fs.writeFile(path.join(output, '_headers'), '/assets/*\n  X-Content-Type-Options: nosniff\n', 'utf8');
  console.log('Cloudflare Pages build ready: dist (API + D1 storage).');
}

build().catch((error) => { console.error(error); process.exitCode = 1; });
