'use strict';
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const TOPICS_JSON = path.join(__dirname, 'topics.json');

// ---- helpers ----

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function loadPosts() {
  return JSON.parse(fs.readFileSync(POSTS_JSON, 'utf8'));
}

function loadTopics() {
  return JSON.parse(fs.readFileSync(TOPICS_JSON, 'utf8'));
}

function nextTopic(posts, topics) {
  const done = new Set(posts.map(p => p.slug));
  return topics.find(t => !done.has(t.slug)) || null;
}

// ---- Claude API call ----

async function generateArticle(topic) {
  const client = new Anthropic();

  const prompt = `あなたは飲食店経営者向けのSEO専門ライターです。
以下の条件でブログ記事を書いてください。

【記事テーマ】${topic.title}
【メインキーワード】${topic.mainKeyword}
【関連キーワード】${topic.relatedKeywords.join('、')}

【ターゲット読者】
- 個人経営〜小規模チェーンの飲食店オーナー
- Googleマップ・SNS集客に課題を持つ方
- 忙しくて時間が取れないが集客を改善したい方

【記事の構成】
1. リード文（150〜200文字、読者の共感から始める。メインKWを含める）
2. H2セクション（4〜6個、各400〜600文字）
   - 必要に応じてH3を使う
   - 箇条書きや番号リストを活用する
   - 具体的な数字・手順・事例を入れる
3. FAQ（3〜5項目、よくある疑問に答える）
4. まとめ（100〜150文字、MEOポストへのCTAを自然に含める）

【MEOポストの紹介タイミング】
記事内の自然な流れで1〜2箇所、以下のように紹介してください：
「料理写真1枚からGoogleマップとInstagramの投稿文を同時生成できるツール『MEOポスト』（meolabo.com）を使うと、毎日の投稿が3分以内で完了します。」

【文字数目標】2,000〜3,000文字

【文体】
- 親しみやすいですます調
- 飲食店現場の実態に即した実践的な内容
- 権威性を示すため具体的な数字・比較を使う

【出力形式】
以下のJSON形式のみで返答してください（余分なテキスト不要）：
{
  "sections": [
    { "type": "lead", "html": "<p>リード文HTML</p>" },
    { "type": "h2", "title": "H2見出しテキスト", "html": "<p>本文HTML</p><ul><li>...</li></ul>" },
    { "type": "h2", "title": "...", "html": "..." },
    { "type": "faq", "items": [
      { "q": "質問文", "a": "回答文" }
    ]},
    { "type": "summary", "html": "<p>まとめHTML</p>" }
  ]
}`;

  const msg = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = msg.content[0].text.trim();
  // extract JSON even if Claude wraps it in ```json ... ```
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude did not return valid JSON');
  return JSON.parse(match[0]);
}

// ---- HTML builder ----

function buildHTML(topic, article, dateStr) {
  const faqSchema = article.sections
    .filter(s => s.type === 'faq')
    .flatMap(s => s.items)
    .map(item => `{"@type":"Question","name":${JSON.stringify(item.q)},"acceptedAnswer":{"@type":"Answer","text":${JSON.stringify(item.a)}}}`)
    .join(',');

  const bodyHtml = article.sections.map(s => {
    if (s.type === 'lead') {
      return `<div class="article-lead">${s.html}</div>`;
    }
    if (s.type === 'h2') {
      return `<section>\n<h2>${esc(s.title)}</h2>\n${s.html}\n</section>`;
    }
    if (s.type === 'faq') {
      const items = s.items.map(item => `
<div class="faq-item">
  <p class="faq-q">${esc(item.q)}</p>
  <p class="faq-a">${esc(item.a)}</p>
</div>`).join('');
      return `<section id="faq"><h2>よくある質問</h2>${items}</section>`;
    }
    if (s.type === 'summary') {
      return `<section class="summary-section">${s.html}</section>`;
    }
    return '';
  }).join('\n\n');

  const dateJP = dateStr.replace(/-/g, '年').replace('年', '年').split('').reduce((a, c, i) => {
    if (i === 5) return a + '月';
    if (i === 8) return a + '日';
    return a + c;
  }, '');
  // simpler date format
  const [y, m, d] = dateStr.split('-');
  const dateJPSimple = `${y}年${parseInt(m)}月${parseInt(d)}日`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(topic.title)}｜MEOポスト</title>
<meta name="description" content="${esc(topic.description)}">
<link rel="canonical" href="https://www.meolabo.com/blog/${topic.slug}/">
<meta property="og:title" content="${esc(topic.title)}｜MEOポスト">
<meta property="og:description" content="${esc(topic.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://www.meolabo.com/blog/${topic.slug}/">
<meta property="og:image" content="https://www.meolabo.com/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-0DJHMC65NC"></script>
<script>
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','G-0DJHMC65NC');
</script>
<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@graph":[
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"MEOポスト","item":"https://www.meolabo.com/"},
      {"@type":"ListItem","position":2,"name":"ブログ","item":"https://www.meolabo.com/blog/"},
      {"@type":"ListItem","position":3,"name":${JSON.stringify(topic.title)}}
    ]},
    {"@type":"Article",
      "headline":${JSON.stringify(topic.title)},
      "description":${JSON.stringify(topic.description)},
      "url":"https://www.meolabo.com/blog/${topic.slug}/",
      "datePublished":"${dateStr}",
      "dateModified":"${dateStr}",
      "author":{"@type":"Organization","name":"株式会社LAM COMPANY"},
      "publisher":{"@type":"Organization","name":"MEOポスト","url":"https://www.meolabo.com/"}
    },
    {"@type":"FAQPage","mainEntity":[${faqSchema}]}
  ]
}
</script>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --brand:#173F35;--brand-dark:#0F2B24;--action:#F06B35;
  --text:#1A1A1A;--muted:#6B7280;--bg:#FFFFFF;--bg-warm:#FFF9F1;--bg-sub:#F5F5F0;
  --border:#E5E7EB;--radius:12px;
}
body{font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif;font-size:16px;color:var(--text);line-height:1.8;background:var(--bg);}
a{color:var(--brand);text-decoration:none;}
a:hover{text-decoration:underline;}
.site-header{background:var(--bg);border-bottom:1px solid var(--border);padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.site-logo{font-size:18px;font-weight:900;color:var(--brand);text-decoration:none;}
.site-logo:hover{text-decoration:none;}
.header-cta{background:var(--action);color:#fff;padding:8px 18px;border-radius:6px;font-size:14px;font-weight:700;white-space:nowrap;}
.header-cta:hover{opacity:.9;text-decoration:none;}
.breadcrumb{padding:12px 0;font-size:13px;color:var(--muted);}
.breadcrumb a{color:var(--muted);}
.breadcrumb span{margin:0 6px;}
.container{max-width:800px;margin:0 auto;padding:0 24px;}
.article-wrap{padding:40px 0 80px;}
.article-header{margin-bottom:40px;}
.article-tag{display:inline-block;background:var(--bg-warm);color:var(--brand);font-size:12px;font-weight:700;padding:4px 10px;border-radius:4px;margin-bottom:16px;}
.article-h1{font-size:clamp(20px,3.5vw,30px);font-weight:900;line-height:1.4;margin-bottom:12px;}
.article-meta{font-size:13px;color:var(--muted);margin-bottom:24px;}
.article-lead{font-size:17px;line-height:1.9;background:var(--bg-warm);border-left:4px solid var(--brand);padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:40px;}
.article-body h2{font-size:clamp(18px,2.5vw,22px);font-weight:900;color:var(--brand-dark);margin:48px 0 16px;padding-bottom:8px;border-bottom:2px solid var(--brand);}
.article-body h3{font-size:18px;font-weight:700;margin:28px 0 10px;}
.article-body p{margin-bottom:18px;}
.article-body ul,.article-body ol{padding-left:24px;margin-bottom:18px;}
.article-body li{margin-bottom:8px;}
.article-body strong{font-weight:700;}
.article-body section{margin-bottom:16px;}
.faq-item{border-bottom:1px solid var(--border);padding:20px 0;}
.faq-q{font-weight:700;font-size:16px;margin-bottom:10px;padding-left:28px;position:relative;}
.faq-q::before{content:"Q";position:absolute;left:0;top:0;background:var(--brand);color:#fff;font-size:12px;font-weight:900;width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;line-height:20px;text-align:center;}
.faq-a{font-size:15px;color:var(--muted);padding-left:28px;}
.summary-section{background:var(--bg-sub);border-radius:var(--radius);padding:24px;margin-top:40px;}
.cta-section{background:var(--brand);color:#fff;border-radius:var(--radius);padding:40px 32px;text-align:center;margin:56px 0 40px;}
.cta-section h2{font-size:clamp(18px,2.5vw,24px);font-weight:900;margin-bottom:12px;color:#fff;border:none;padding:0;}
.cta-section p{font-size:15px;opacity:.85;margin-bottom:28px;}
.btn-cta{display:inline-block;background:var(--action);color:#fff;font-size:16px;font-weight:900;padding:16px 32px;border-radius:8px;text-decoration:none;}
.btn-cta:hover{opacity:.9;text-decoration:none;}
.cta-note{font-size:13px;opacity:.7;margin-top:12px;}
.related-links{background:var(--bg-sub);border-radius:var(--radius);padding:24px;margin:40px 0;}
.related-links h3{font-size:15px;font-weight:700;margin-bottom:14px;}
.related-links ul{list-style:none;padding:0;}
.related-links li{margin-bottom:8px;font-size:15px;}
.related-links li::before{content:"→ ";color:var(--action);}
.site-footer{background:var(--brand-dark);color:rgba(255,255,255,.5);padding:32px 24px;font-size:13px;text-align:center;}
.site-footer a{color:rgba(255,255,255,.6);}
@media(max-width:640px){.container{padding:0 16px;}.cta-section{padding:32px 20px;}}
</style>
</head>
<body>
<header class="site-header">
  <a href="/" class="site-logo">MEOポスト</a>
  <a href="/#form-section" class="header-cta">無料デモを申し込む</a>
</header>
<main>
<div class="container">
<nav class="breadcrumb" aria-label="パンくずリスト">
  <a href="/">MEOポスト</a><span>›</span><a href="/blog/">ブログ</a><span>›</span>${esc(topic.title)}
</nav>
<article class="article-wrap">
  <header class="article-header">
    <span class="article-tag">MEO・SNS集客</span>
    <h1 class="article-h1">${esc(topic.title)}</h1>
    <p class="article-meta">公開日：${dateJPSimple}｜MEOポスト編集部</p>
  </header>
  <div class="article-body">
${bodyHtml}
  </div>
  <div class="cta-section">
    <h2>投稿文の作成、AIに任せてみませんか？</h2>
    <p>料理写真1枚からGoogleマップとInstagramの投稿文を同時生成。<br>無料デモで実際の生成をお見せします。</p>
    <a href="/#form-section" class="btn-cta">無料デモを申し込む</a>
    <p class="cta-note">2営業日以内にご連絡します</p>
  </div>
  <div class="related-links">
    <h3>関連ページ</h3>
    <ul>
      <li><a href="/">MEOポスト トップページ</a></li>
      <li><a href="/google-business-profile-post-ai/">Googleビジネスプロフィールの投稿文をAIで作成する方法</a></li>
      <li><a href="/restaurant-instagram-post-ai/">飲食店のInstagram投稿文をAIで作成する方法</a></li>
      <li><a href="/blog/">ブログ一覧</a></li>
    </ul>
  </div>
</article>
</div>
</main>
<footer class="site-footer">
  <p>© 2026 MEOポスト｜株式会社LAM COMPANY｜<a href="/privacy.html">プライバシーポリシー</a></p>
</footer>
</body>
</html>`;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Blog index regenerator ----

function rebuildIndex(posts) {
  const listHTML = posts.length === 0
    ? '<p style="color:var(--muted)">記事を準備中です。</p>'
    : posts.map(p => `
<article class="post-card">
  <a href="/blog/${p.slug}/" class="post-link">
    <div class="post-meta">${p.date}</div>
    <h2 class="post-title">${esc(p.title)}</h2>
    <p class="post-desc">${esc(p.description)}</p>
    <span class="post-read">続きを読む →</span>
  </a>
</article>`).join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ブログ｜飲食店のMEO・SNS集客情報｜MEOポスト</title>
<meta name="description" content="飲食店オーナー向けのGoogleマップ集客・Instagram運用・MEO対策に関する実践的な情報を発信しています。">
<link rel="canonical" href="https://www.meolabo.com/blog/">
<meta property="og:title" content="ブログ｜飲食店のMEO・SNS集客情報｜MEOポスト">
<meta property="og:description" content="飲食店オーナー向けのGoogleマップ集客・Instagram運用・MEO対策に関する実践的な情報を発信しています。">
<meta property="og:type" content="website">
<meta property="og:url" content="https://www.meolabo.com/blog/">
<meta property="og:image" content="https://www.meolabo.com/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-0DJHMC65NC"></script>
<script>
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','G-0DJHMC65NC');
</script>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --brand:#173F35;--brand-dark:#0F2B24;--action:#F06B35;
  --text:#1A1A1A;--muted:#6B7280;--bg:#FFFFFF;--bg-warm:#FFF9F1;--bg-sub:#F5F5F0;
  --border:#E5E7EB;--radius:12px;
}
body{font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif;font-size:16px;color:var(--text);line-height:1.8;background:var(--bg);}
a{color:var(--brand);text-decoration:none;}
a:hover{text-decoration:underline;}
.site-header{background:var(--bg);border-bottom:1px solid var(--border);padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
.site-logo{font-size:18px;font-weight:900;color:var(--brand);text-decoration:none;}
.site-logo:hover{text-decoration:none;}
.header-cta{background:var(--action);color:#fff;padding:8px 18px;border-radius:6px;font-size:14px;font-weight:700;white-space:nowrap;}
.header-cta:hover{opacity:.9;text-decoration:none;}
.container{max-width:800px;margin:0 auto;padding:0 24px;}
.page-header{padding:48px 0 32px;}
.page-tag{display:inline-block;background:var(--bg-warm);color:var(--brand);font-size:12px;font-weight:700;padding:4px 10px;border-radius:4px;margin-bottom:12px;}
.page-h1{font-size:clamp(22px,3vw,30px);font-weight:900;margin-bottom:8px;}
.page-desc{color:var(--muted);font-size:15px;}
.post-list{padding:0 0 80px;}
.post-card{border:1px solid var(--border);border-radius:var(--radius);margin-bottom:20px;transition:box-shadow .2s;}
.post-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.08);}
.post-link{display:block;padding:24px 28px;text-decoration:none;color:inherit;}
.post-link:hover{text-decoration:none;}
.post-meta{font-size:13px;color:var(--muted);margin-bottom:8px;}
.post-title{font-size:18px;font-weight:700;margin-bottom:10px;color:var(--text);}
.post-desc{font-size:15px;color:var(--muted);margin-bottom:12px;}
.post-read{font-size:14px;color:var(--action);font-weight:600;}
.site-footer{background:var(--brand-dark);color:rgba(255,255,255,.5);padding:32px 24px;font-size:13px;text-align:center;}
.site-footer a{color:rgba(255,255,255,.6);}
@media(max-width:640px){.container{padding:0 16px;}.post-link{padding:20px;}}
</style>
</head>
<body>
<header class="site-header">
  <a href="/" class="site-logo">MEOポスト</a>
  <a href="/#form-section" class="header-cta">無料デモを申し込む</a>
</header>
<main>
<div class="container">
  <div class="page-header">
    <span class="page-tag">ブログ</span>
    <h1 class="page-h1">飲食店のMEO・SNS集客情報</h1>
    <p class="page-desc">Googleマップ集客・Instagram運用・MEO対策に関する実践的な情報を発信しています。</p>
  </div>
  <div class="post-list">
${listHTML}
  </div>
</div>
</main>
<footer class="site-footer">
  <p>© 2026 MEOポスト｜株式会社LAM COMPANY｜<a href="/privacy.html">プライバシーポリシー</a></p>
</footer>
</body>
</html>`;
}

// ---- main ----

async function main() {
  const posts = loadPosts();
  const topics = loadTopics();

  const topic = nextTopic(posts, topics);
  if (!topic) {
    console.log('✅ All topics have been published. Add more topics to topics.json.');
    return;
  }

  console.log(`📝 Generating: ${topic.title}`);
  const article = await generateArticle(topic);

  const dateStr = today();
  const html = buildHTML(topic, article, dateStr);

  // Save post HTML
  const postDir = path.join(BLOG_DIR, topic.slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, 'index.html'), html);
  console.log(`✅ Saved: blog/${topic.slug}/index.html`);

  // Update posts.json
  posts.unshift({
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    date: dateStr,
  });
  fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2));

  // Rebuild blog index
  const indexHTML = rebuildIndex(posts);
  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), indexHTML);
  console.log('✅ Blog index rebuilt.');

  console.log(`\n🎉 Done: https://www.meolabo.com/blog/${topic.slug}/`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
