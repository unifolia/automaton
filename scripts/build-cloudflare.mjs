import { cpSync, rmSync } from 'node:fs';

const out = 'dist-cloudflare/automaton';
const files = [
  'index.html',
  'clothes.css',
  'favicon.ico',
  'resonator.wav',
  'brain/brain.js',
  'details/index.html',
];

rmSync('dist-cloudflare', { recursive: true, force: true });
for (const file of files) {
  cpSync(file, `${out}/${file}`, { recursive: true });
}
console.log(`copied ${files.length} files to ${out}/`);
