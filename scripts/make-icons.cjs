/* Generates public/icons/icon-192.png and icon-512.png without any image library: navy rounded square with a light "CG" block mark. */
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) { const [r, g, b, a] = pixel(x, y); const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a; }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// Mark: rounded navy square; a white "C" (ring with a gap) and a cyan "G" bar inside, drawn geometrically.
function pixel(size) {
  const r = size * 0.2, navy = [11, 42, 91], cyan = [15, 76, 154], white = [255, 255, 255];
  return (x, y) => {
    const cx = Math.min(Math.max(x, r), size - r), cy = Math.min(Math.max(y, r), size - r);
    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) return [0, 0, 0, 0];
    const u = x / size, v = y / size;
    // "C": ring centred left
    const dx = u - 0.40, dy = v - 0.5, d = Math.sqrt(dx * dx + dy * dy);
    const inRing = d > 0.17 && d < 0.27 && !(dx > 0.05 && Math.abs(dy) < 0.11);
    if (inRing) return [...white, 255];
    // "G" bar: cyan block to the right
    if (u > 0.60 && u < 0.78 && v > 0.30 && v < 0.70) return [...cyan, 255];
    if (u > 0.60 && u < 0.86 && v > 0.60 && v < 0.70) return [...cyan, 255];
    return [...navy, 255];
  };
}

const out = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(out, { recursive: true });
for (const size of [192, 512]) fs.writeFileSync(path.join(out, `icon-${size}.png`), png(size, pixel(size)));
console.log("icons written to public/icons");
