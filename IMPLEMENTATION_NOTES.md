# IMPLEMENTATION_NOTES.md

作成日: 2026-07-10
対象: MEOポスト LP リニューアル（meolabo-lp/index.html）

---

## 1. 変更したファイル

| ファイル | 変更内容 |
|---|---|
| `index.html` | 全面リニューアル（既存の技術スタックは維持） |
| `IMPLEMENTATION_NOTES.md` | 本ファイル（新規） |

---

## 2. 実装したセクション（指示書 § 5 の順番通り）

1. ヘッダー（PC ナビ・スマートフォンハンバーガーメニュー）
2. ファーストビュー（H1・説明・オレンジCTA・安心項目・プロダクトモック）
3. 簡易デモ（タブ切り替え：Googleマップ / Instagram / ハッシュタグ）
4. ターゲットの明示（6項目チェックリスト・強調帯）
5. 問題への共感（ディープグリーン背景・タイムライン図解）
6. 解決策・3ステップ（+ AIは自動投稿しない注記・CTA）
7. 導入前後（Before / After カード・中心コピー）
8. BONGOケーススタディ（課題・使い方・結果の3ブロック + 投稿頻度数値 + 検索順位参考）
9. 発信を続ける意味（確認項目5点・結論：順位保証なし）
10. 他の選択肢との比較（ChatGPT / Canva / SNS管理 / 運用代行 / MEOポスト 5カード）
11. MEOポストを選ぶ理由（4理由カード）
12. 機能紹介（中核5機能 + 拡張4機能を区別して表示）
13. 料金プラン（ライト / スタンダード / プレミアム・契約情報はデモ後案内）
14. 開発者・運営会社（founder.jpg 使用・本文コピー）
15. FAQ（14問・カテゴリーフィルター・アコーディオン）
16. 最終CTA（ディープグリーン背景・4安心項目）
17. 無料デモ申込みフォーム（3ステップ・写真アップロード付き）
18. フッター（会社情報・法人サイト・プライバシーポリシーリンク維持）

スマートフォン固定CTA（hero通過後表示 / form-section到達で非表示）

---

## 3. フォーム送信方式

- **バックエンド**: 既存の Formspree（`https://formspree.io/f/mrewvale`）を維持
- **送信方式**: `fetch` + `FormData`（multipart/form-data）
- **写真添付**: クライアント側で Canvas API により長辺1,600px・2MB 以下に圧縮後、Formspree へ添付
- **スパム対策**: ハニーポット（`name="_gotcha"`）・二重送信防止（送信後ボタン disabled）
- **UTM保存**: url パラメータ + referrer を hidden field で送信

### Formspree プランについての確認事項
Formspree の無料プランはファイル添付非対応です。
写真アップロードを確実に機能させるには **Formspree 有料プランへのアップグレードを推奨**します。
無料プランの場合、写真は添付されませんが、テキストフォームとしては正常動作します。

---

## 4. 写真の扱い

- 送信先: Formspree（メール通知への添付）
- クライアント側処理: Canvas 圧縮（JPEG・長辺1600px以下・2MB以下目安）
- ファイル種別バリデーション: `image/jpeg` / `image/png` / `image/webp`（ファイル名ではなく MIME type で判定）
- プレビュー・削除・差し替え対応
- カメラ撮影対応（`capture="environment"` 属性）
- 写真はデモ作成目的以外に使用しないことをフォーム内に明記

---

## 5. 追加した GA4 イベント

| イベント名 | 発火タイミング |
|---|---|
| `lp_cta_click` | 各CTAボタンクリック（`cta_location` パラメータ付き） |
| `lp_demo_view` | デモセクション・タブ切り替え |
| `lp_pricing_view` | 料金セクション表示（IntersectionObserver） |
| `lp_case_study_view` | 導入事例セクション表示 |
| `lp_faq_open` | FAQ 展開（`faq_question` パラメータ付き） |
| `demo_form_start` | フォーム STEP 1 完了（STEP 2 へ進む） |
| `demo_photo_selected` | 写真選択（`file_type` パラメータ付き） |
| `demo_form_step_complete` | 各ステップ完了 |
| `demo_form_submit` | 送信ボタンクリック |
| `demo_form_success` | 送信成功 |
| `demo_form_error` | 送信失敗 |

全イベントに `device_type`（mobile / desktop）を自動付加。
個人情報・メールアドレス・写真URLはGA4へ送信していません。

### GA4 Measurement ID について
現在 `G-XXXXXXXXXX` プレースホルダーです。
**実際の Measurement ID に差し替えてください**（index.html の2箇所）。

---

## 6. SEO対応

- `<title>`: 指示書通りに設定
- `<meta name="description">`: 指示書通りに設定
- `<link rel="canonical">`: 設定済み
- OG タグ（og:title / og:description / og:image / og:url）: 設定済み
- Twitter Card: 設定済み
- 構造化データ（JSON-LD）: Organization / SoftwareApplication / FAQPage
- H1 は1つ（ファーストビュー）、H2 はセクション見出し、H3 はカード見出し

### 不足アセット
- `og-image.jpg`: 現在存在しません。OGP 画像を用意して `/og-image.jpg` に配置してください。

---

## 7. 画像資産の状況

| アセット | 状況 | 対応 |
|---|---|---|
| `founder.jpg` | 存在・使用中 | 開発者セクションで使用 |
| `og-image.jpg` | **未存在** | OGP 用に要用意（1200×630px 推奨） |
| BONGO 店内・外観写真 | **未存在** | プレースホルダーなし（テキストで代替） |
| 実際の料理写真 | **未存在** | プロダクトモックは CSS で代替 |
| MEO画面スクリーンショット | **未存在** | CSS モックで代替 |

実写が用意できた場合は、各セクションの画像要素に差し替えてください。

---

## 8. 確認が必要な契約条件

以下は現行サービス仕様を確認できなかったため、プレースホルダー表示またはデモ後案内としました。

| 項目 | 現状の対応 |
|---|---|
| 初期費用 | 「導入前にご確認ください」と記載 |
| 最低利用期間 | FAQ で「デモ時にご確認ください」 |
| 解約方法・条件 | FAQ で「デモ時にご確認ください」 |
| 支払方法 | 未記載（デモ後案内） |
| プラン変更 | 未記載（デモ後案内） |
| 生成回数のリセット時期 | 「毎月リセット（詳細は導入前にご確認ください）」と注記 |
| 年払い請求総額（プレミアム） | ¥12,800×12=¥153,600 だが未掲載（要確認の上掲載） |

---

## 9. レスポンシブ確認結果（JavaScript 検証）

- 横スクロール: **なし**
- 全セクション存在: **16/16**
- コンソールエラー: **0件**
- フォームバリデーション: **正常**
- FAQアコーディオン: **正常**
- デモタブ切り替え: **正常**
- Formspreeエンドポイント: **維持**
- プライバシーポリシーリンク: **維持**
- scroll-margin-top: **65px（全アンカーセクション）**

ブラウザ拡張のスクリーンショットが長いページ（15,497px）でスクロール位置によって
白画像になる現象がありましたが、JavaScript による DOM・スタイル検証で正常動作を確認済みです。

---

## 10. 未対応・改善候補

- [ ] GA4 Measurement ID を実際の値に差し替え
- [ ] Formspree 有料プランへのアップグレード（写真添付のため）
- [ ] OGP 画像（og-image.jpg）の用意
- [ ] 実写アセット（BONGO 店内・料理・アプリ画面）の用意・差し替え
- [ ] プレミアム年払いの請求総額確認・掲載
- [ ] 解約条件・最低利用期間・支払方法の確認・FAQ更新
- [ ] プライバシーポリシーへの「写真の保存期間と利用目的」追記（Formspree 保存期間に依存）
- [ ] Lighthouse スコア計測（本番ビルド後に実施）
- [ ] 実機での iOS Safari / Android Chrome 動作確認
- [ ] 写真アップロードの DataTransfer API 非対応ブラウザ対応（現在は古い Safari で動作しない可能性）

---

## 11. デプロイ方法

```bash
cd /Users/shinozakitomohisa/meolabo-lp
git add index.html IMPLEMENTATION_NOTES.md
git commit -m "LP全面リニューアル：3ステップフォーム・写真アップロード・FAQ・比較・GA4イベント追加"
git push
```

Vercel 連携済みのため、push 後に自動デプロイされます。
本番 URL: https://www.meolabo.com/
