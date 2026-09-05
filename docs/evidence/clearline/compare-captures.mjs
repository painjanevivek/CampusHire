import sharp from 'sharp';
import path from 'node:path';
const evidenceDirectory = import.meta.dirname;

async function main() {
  const source = process.argv[2];
  if (!source) throw new Error('Pass the selected Clearline source board path.');
  const board = await sharp(source).resize(1448, 1086).png().toBuffer();
  await sharp(board).toFile(path.join(evidenceDirectory, 'selected-clearline.png'));
  const comparisons = [
    ['applications', { left: 20, top: 58, width: 1409, height: 659 }, 'applications-1440.png'],
    ['landing', { left: 20, top: 753, width: 673, height: 275 }, 'landing-1440.png'],
    ['student', { left: 732, top: 753, width: 697, height: 275 }, 'student-dashboard-1440.png'],
  ];
  for (const [name, crop, implementation] of comparisons) {
    const ref = await sharp(board).extract(crop).resize({ width: 1000 }).png().toBuffer();
    const actual = await sharp(path.join(evidenceDirectory, implementation)).resize({ width: 1000 }).png().toBuffer();
    const a = await sharp(ref).metadata();
    const b = await sharp(actual).metadata();
    await sharp({ create: { width: 2020, height: Math.max(a.height, b.height), channels: 3, background: '#f8f9fb' } })
      .composite([{ input: ref, left: 0, top: 0 }, { input: actual, left: 1020, top: 0 }])
      .png().toFile(path.join(evidenceDirectory, `${name}-comparison.png`));
  }
  const refFocus = await sharp(board).extract({ left: 220, top: 70, width: 870, height: 240 }).png().toBuffer();
  const actualFocus = await sharp(path.join(evidenceDirectory, 'applications-1440.png')).extract({ left: 215, top: 20, width: 790, height: 445 }).resize({ width: 870 }).png().toBuffer();
  await sharp({ create: { width: 1760, height: 491, channels: 3, background: '#f8f9fb' } })
    .composite([{ input: refFocus, left: 0, top: 0 }, { input: actualFocus, left: 890, top: 0 }])
    .png().toFile(path.join(evidenceDirectory, 'applications-focused-comparison.png'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
