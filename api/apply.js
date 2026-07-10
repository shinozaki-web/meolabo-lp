const Busboy = require('busboy');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const STAFF_EMAIL = process.env.STAFF_EMAIL || process.env.GMAIL_USER;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  let fields, photoFile;
  try {
    ({ fields, photoFile } = await parseMultipart(req));
  } catch (e) {
    console.error('Parse error:', e);
    return res.status(400).json({ error: 'parse_error', message: 'データの読み込みに失敗しました。' });
  }

  // Honeypot: bots fill this, humans don't
  if (fields._gotcha) return res.status(200).json({ ok: true });

  const email = fields.email;
  const name = fields.name;
  const storeName = fields.store_name;

  if (!email || !name || !storeName) {
    return res.status(422).json({ error: 'validation', message: '必須項目が不足しています。' });
  }

  // Validate photo via magic bytes — reject if not a real image
  let attachment = null;
  if (photoFile) {
    const detectedMime = detectMimeFromBuffer(photoFile.buffer);
    if (!detectedMime || !ALLOWED_MIMES.has(detectedMime)) {
      return res.status(422).json({ error: 'invalid_photo', message: '写真ファイルが無効です。JPEG・PNG・WebPを選択してください。' });
    }
    const ext = ALLOWED_MIMES.get(detectedMime);
    const safeDish = (fields.dish_name || '料理写真')
      .replace(/[\r\n]/g, '')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .slice(0, 64);
    attachment = {
      filename: `${safeDish}${ext}`,
      content: photoFile.buffer,
    };
  }

  const concerns = [].concat(fields.concerns || []).filter(Boolean);

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"MEOポスト申込" <${process.env.GMAIL_USER}>`,
        to: STAFF_EMAIL,
        subject: `【デモ申込】${storeName}（${name}様）`,
        html: buildStaffEmail({ fields, concerns, hasPhoto: !!attachment }),
        attachments: attachment ? [attachment] : [],
      }),
      transporter.sendMail({
        from: `"MEOポスト" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '【MEOポスト】無料デモのお申込みを受け付けました',
        html: buildCustomerEmail({ name, storeName }),
      }),
    ]);
  } catch (e) {
    console.error('Email error:', e);
    return res.status(500).json({ error: 'email_error', message: '送信に失敗しました。しばらく経ってから再度お試しください。' });
  }

  return res.status(200).json({ ok: true });
};

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
    const fields = {};
    let photoFile = null;

    bb.on('field', (name, val) => {
      if (name in fields) {
        fields[name] = [].concat(fields[name], val);
      } else {
        fields[name] = val;
      }
    });

    bb.on('file', (name, stream, info) => {
      if (name !== 'food_photo') { stream.resume(); return; }
      const chunks = [];
      stream.on('data', d => chunks.push(d));
      stream.on('end', () => {
        if (chunks.length > 0) {
          photoFile = { buffer: Buffer.concat(chunks), mimetype: info.mimeType };
        }
      });
    });

    bb.on('close', () => resolve({ fields, photoFile }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

const ALLOWED_MIMES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png',  '.png'],
  ['image/webp', '.webp'],
]);

function detectMimeFromBuffer(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
      buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) return 'image/png';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp';
  return null;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function buildStaffEmail({ fields, concerns, hasPhoto }) {
  const f = k => esc(Array.isArray(fields[k]) ? fields[k].join(', ') : (fields[k] || '—'));
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;font-size:14px;color:#333;max-width:640px;">
<h2 style="color:#173F35;margin-bottom:4px;">新規デモ申込</h2>
<p style="color:#666;margin-top:0;">${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;border-color:#ddd;">
  <tr><th style="background:#f5f5f5;text-align:left;white-space:nowrap;width:140px;">店舗名</th><td>${f('store_name')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">業態</th><td>${f('store_type')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">都道府県</th><td>${f('prefecture')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">料理名</th><td>${f('dish_name')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">今日伝えたいこと</th><td>${f('message_hint')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">困っていること</th><td>${concerns.length ? esc(concerns.join('、')) : '—'}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">お名前</th><td>${f('name')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">メール</th><td><a href="mailto:${f('email')}">${f('email')}</a></td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">電話</th><td>${f('phone')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">質問・要望</th><td>${f('note')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">流入元</th><td>${f('utm_source') !== '—' ? f('utm_source') : f('referrer')}</td></tr>
  <tr><th style="background:#f5f5f5;text-align:left;">料理写真</th><td>${hasPhoto ? '✅ 添付あり' : '—'}</td></tr>
</table>
</body></html>`;
}

function buildCustomerEmail({ name, storeName }) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;font-size:15px;color:#333;max-width:600px;margin:0 auto;padding:24px;">
<p>${esc(name)} 様</p>
<p>MEOポストへの無料デモお申込みありがとうございます。</p>
<p>「<strong>${esc(storeName)}</strong>」の料理写真を使ったデモを準備しています。<br>
<strong>2営業日以内</strong>に、実際に生成された投稿文サンプルをこのメールへの返信でお送りします。</p>
<p>ご質問はこのメールへの返信でお気軽にどうぞ。</p>
<p style="margin-top:40px;padding-top:16px;border-top:1px solid #eee;color:#888;font-size:13px;">— MEOポスト（株式会社meolabo）</p>
</body></html>`;
}
