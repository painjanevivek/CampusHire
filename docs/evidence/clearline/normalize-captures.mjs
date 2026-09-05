// Normalize the in-app browser's 165% Windows display-scale capture padding.
// Raw screenshots are retained verbatim; no UI content is drawn or changed.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const evidenceDirectory = import.meta.dirname;

async function main() {
  for (const name of await fs.readdir(evidenceDirectory)) {
    if (!name.endsWith('-raw.png')) continue;
    const source = path.join(evidenceDirectory, name);
    const { width, height } = await sharp(source).metadata();
    await sharp(source)
      .extract({ left: 0, top: 0, width: Math.ceil(width / 1.65), height: Math.ceil(height / 1.65) })
      .resize(width, height)
      .png()
      .toFile(path.join(evidenceDirectory, name.replace('-raw.png', '.png')));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
