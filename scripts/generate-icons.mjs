import sharp from 'sharp'

const sizes = [192, 512]

for (const size of sizes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#000000"/>
    <text x="${size / 2}" y="${size * 0.72}" font-size="${size * 0.55}" text-anchor="middle" fill="white" font-family="system-ui">₢</text>
  </svg>`

  await sharp(Buffer.from(svg))
    .png()
    .toFile(`public/icon-${size}.png`)

  console.log(`icon-${size}.png criado`)
}