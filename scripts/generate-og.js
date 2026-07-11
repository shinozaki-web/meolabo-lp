'use strict';
const sharp = require('sharp');
const path = require('path');

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">

  <!-- Background -->
  <rect width="1200" height="630" fill="#173F35"/>

  <!-- Top accent bar -->
  <rect width="1200" height="8" fill="#F06B35"/>

  <!-- Decorative circles (depth) -->
  <circle cx="1080" cy="80" r="220" fill="#0F2B24" opacity="0.6"/>
  <circle cx="1160" cy="580" r="160" fill="#0F2B24" opacity="0.35"/>
  <circle cx="20"   cy="620" r="120" fill="#0F2B24" opacity="0.25"/>

  <!-- Brand pill -->
  <rect x="60" y="70" width="192" height="46" rx="23" fill="#F06B35"/>
  <text x="156" y="100"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="22" font-weight="700" fill="white" text-anchor="middle">MEOポスト</text>

  <!-- Main headline -->
  <text x="60" y="210"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="54" font-weight="900" fill="white">料理写真1枚から、</text>
  <text x="60" y="278"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="54" font-weight="900" fill="white">Googleマップ・Instagram</text>
  <text x="60" y="346"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="54" font-weight="900" fill="white">投稿文をAIで自動生成</text>

  <!-- Tagline -->
  <text x="60" y="440"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="26" fill="rgba(255,255,255,0.65)">飲食店向け AI投稿文生成ツール</text>

  <!-- Feature badges -->
  <rect x="60"  y="480" width="170" height="42" rx="8" fill="rgba(255,255,255,0.1)"/>
  <text x="145" y="507"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">Googleマップ対応</text>

  <rect x="246" y="480" width="170" height="42" rx="8" fill="rgba(255,255,255,0.1)"/>
  <text x="331" y="507"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">Instagram対応</text>

  <rect x="432" y="480" width="170" height="42" rx="8" fill="rgba(255,255,255,0.1)"/>
  <text x="517" y="507"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">写真1枚で完結</text>

  <!-- URL -->
  <text x="60" y="585"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="20" fill="rgba(255,255,255,0.4)">meolabo.com</text>

  <!-- Right panel: mock UI card -->
  <rect x="860" y="160" width="300" height="310" rx="16" fill="#0F2B24"/>
  <rect x="860" y="160" width="300" height="8"   rx="8"  fill="#F06B35" opacity="0.8"/>

  <!-- Card inner: step indicators -->
  <text x="1010" y="220"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="15" fill="rgba(255,255,255,0.5)" text-anchor="middle">生成プレビュー</text>

  <!-- Step 1 -->
  <circle cx="896" cy="268" r="16" fill="#F06B35"/>
  <text x="896" y="274" font-family="sans-serif" font-size="14" font-weight="700"
        fill="white" text-anchor="middle">1</text>
  <text x="922" y="274"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="16" fill="white">料理写真を選ぶ</text>

  <!-- Connector -->
  <line x1="896" y1="284" x2="896" y2="308" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>

  <!-- Step 2 -->
  <circle cx="896" cy="324" r="16" fill="#F06B35"/>
  <text x="896" y="330" font-family="sans-serif" font-size="14" font-weight="700"
        fill="white" text-anchor="middle">2</text>
  <text x="922" y="330"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="16" fill="white">ひと言メモを追加</text>

  <!-- Connector -->
  <line x1="896" y1="340" x2="896" y2="364" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>

  <!-- Step 3 -->
  <circle cx="896" cy="380" r="16" fill="#F06B35"/>
  <text x="896" y="386" font-family="sans-serif" font-size="14" font-weight="700"
        fill="white" text-anchor="middle">3</text>
  <text x="922" y="386"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="16" fill="white">投稿文が完成</text>

  <!-- Output label -->
  <rect x="876" y="412" width="268" height="44" rx="8" fill="#F06B35" opacity="0.15"/>
  <text x="1010" y="436"
        font-family="Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans CJK JP, sans-serif"
        font-size="13" fill="#F06B35" text-anchor="middle">Gマップ &amp; Instagram文 同時生成</text>

</svg>`;

const outputPath = path.join(__dirname, '..', 'og-image.png');

sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath)
  .then(info => {
    console.log(`✅ OGP image generated: og-image.png (${info.width}x${info.height})`);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
