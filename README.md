# WorkoutNote

ノート的に筋トレを記録するPWA(Progressive Web App)。
レイメイのウィークリーバーチカルノートのような書き味を目指す。

iPhoneのSafariで開いて「ホーム画面に追加」すれば、ネイティブアプリのように使える。

## 特徴

- 1日=縦スクロールの記録ビュー(画像のような最小表示)
- 種目ごとに「本セット重量 / ウォームアップ重量 / レップ配列」を記録
- 種目辞書に略称(WRPD など)を登録 → 入力補完
- ルーティンテンプレで「背中の日」などをワンタップ展開
- 入力モードはフォーム/テキスト直書き 切り替え式
- 週一覧ビュー、種目別グラフビュー
- オフラインで動く(PWA)
- データはブラウザ内に保存(IndexedDB)

## 技術スタック

- React 18 + TypeScript
- Vite(ビルドツール)
- Tailwind CSS
- Dexie.js(IndexedDB ラッパー)
- Recharts(グラフ)
- vite-plugin-pwa(PWA化)

## ドキュメント

実装に着手する前に必ず読むこと:

- [`SPEC.md`](./SPEC.md) — 機能要件・データモデル・画面仕様
- [`CLAUDE.md`](./CLAUDE.md) — Claude Code 用作業ガイド
- [`docs/TASKS.md`](./docs/TASKS.md) — 実装タスクの段階的分割
- [`docs/SETUP.md`](./docs/SETUP.md) — 環境構築・起動手順

## クイックスタート

```bash
npm install
npm run dev
# http://localhost:5173 をブラウザで開く
```

## ライセンス

MIT
