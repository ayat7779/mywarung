const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to write raw PNG
function createSolidPng(width, height, r, g, b) {
  // Minimal PNG generator in pure Node.js
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc = crc ^ buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xED888320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const header = Buffer.from([139, 80, 78, 71, 13, 10, 26, 10]); // \x89PNG\r\n\x1a\n

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type 2 (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image bytes with filter byte 0 per scanline
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * 3;
      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Emerald/Slate theme color RGB: (16, 185, 129)
const png192 = createSolidPng(192, 192, 16, 185, 129);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);

const png512 = createSolidPng(512, 512, 15, 23, 42); // slate-900
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);

const pngApple = createSolidPng(180, 180, 16, 185, 129);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), pngApple);

console.log('PWA icons created successfully in public/icons!');
