import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
export function pwaPlugin(): Plugin {
  const appVersion=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version as string;
  const base = '/drink-rate-a56/';
  let out = '';
  return {
    name: 'not-offline',
    apply: 'build',
    configResolved(c) {
      out = resolve(c.root, c.build.outDir);
    },
    closeBundle() {
      const redirect = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${base}"><title>Mở NỐT</title><p>Đang mở NỐT… <a href="${base}">Mở ứng dụng</a></p><script>location.replace(${JSON.stringify(base)}+location.search+location.hash)</script></html>`;
      mkdirSync(join(out, 'assets'), { recursive: true });
      writeFileSync(join(out, 'assets/index.html'), redirect);
      writeFileSync(join(out, '404.html'), redirect);
      writeFileSync(join(out, '.nojekyll'), '');
      function files(dir: string, prefix = ''): string[] {
        return readdirSync(dir, { withFileTypes: true })
          .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules')
          .flatMap((e) =>
            e.isDirectory() ? files(join(dir, e.name), prefix + e.name + '/') : [prefix + e.name],
          );
      }
      const names = files(out)
        .filter((x) => !['sw.js', 'version.json', '.nojekyll'].includes(x))
        .sort();
      const digest = createHash('sha256');
      for (const name of names) digest.update(name).update(readFileSync(join(out, name)));
      const build = digest.digest('hex').slice(0, 16);
      writeFileSync(
        join(out, 'version.json'),
        JSON.stringify({ version: appVersion, build, precacheFiles: names.length + 2 }),
      );
      const urls = [base, ...names.map((n) => base + n), base + 'version.json'];
      const source = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8')
        .replace('__BUILD__', JSON.stringify(build))
        .replace('__PRECACHE__', JSON.stringify(urls));
      writeFileSync(join(out, 'sw.js'), source);
    },
  };
}
