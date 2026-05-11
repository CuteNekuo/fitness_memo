# Claude Code 作業ガイド

このリポジトリで作業する Claude Code のための手引き。

## プロジェクト概要

ノート的に筋トレを記録する PWA。詳細は [`SPEC.md`](./SPEC.md) を読むこと。

## 技術スタック(固定)

- **言語**: TypeScript(strict mode)
- **UI**: React 18(関数コンポーネント + Hooks のみ)
- **ビルド**: Vite
- **スタイル**: Tailwind CSS
- **永続化**: Dexie.js(IndexedDB ラッパー)
- **ルーティング**: react-router-dom v6
- **グラフ**: Recharts
- **PWA**: vite-plugin-pwa
- **テスト**: Vitest

外部ライブラリは上記以外なるべく追加しない。追加が必要なら相談。

## 作業の進め方

1. まず [`docs/TASKS.md`](./docs/TASKS.md) を開いて、現在の Phase を確認する
2. その Phase の未完了タスクから1つ選び、実装する
3. タスク完了後、`docs/TASKS.md` のチェックボックスを更新する
4. 1 Phase 終わったら一度ユーザーに確認する(勝手に次の Phase へ進まない)

## コーディング規約

### 命名

- コンポーネント: PascalCase(`DailyView`)
- フック: `use` プレフィクス(`useWorkoutDay`)
- ユーティリティ: lowerCamelCase
- ファイル名: 中身の主要なエクスポートと一致(`DailyView.tsx`)

### React

- コンポーネントは小さく分割(1ファイル200行を目安)
- ロジックはカスタムフックに切り出す
- `useEffect` の濫用を避ける(派生値は `useMemo` で)
- マジックナンバーは `constants.ts` か定数として明示

### Dexie

- スキーマ定義は `src/db/schema.ts` に集約
- CRUD関数は `src/db/repository.ts` でラップ(コンポーネントから直接 db を触らない)
- マイグレーションが必要な変更は version を上げる(コメント必須)

### Tailwind

- カスタムユーティリティは `tailwind.config.js` の `theme.extend` に
- `@apply` の濫用は避ける(クラスの組み合わせで対応)
- ダークモード前提だが、`dark:` で明確に分ける

### TypeScript

- `any` 禁止(やむを得ない場合は `unknown` + 型ガード)
- DB のレコード型は `src/db/schema.ts` で `export interface` する
- ID は `string` 型(uuid)で統一

### コメント

- 「なぜそうしたか」を書く。「何をしているか」は書かない
- TODO は `// TODO(scope): description` の形式

## テスト

- パース系・日付ユーティリティなどの純粋ロジックには Vitest
- `src/lib/parser.ts` のテストは最初から作る(テキストモードの仕様確定のため)
- コンポーネントのスナップショットテストは Phase 1-2 では不要

## 禁止事項

- ❌ class component
- ❌ Redux 等の重量級状態管理(useState + Context で足りる)
- ❌ `console.log` 放置(消すか開発時のみ表示する形に)
- ❌ Force unwrap (`!.`)の濫用
- ❌ ユーザー確認なしの Phase またぎ大改修

## デザイントーン

- 背景: 黒(`bg-black`)、ライトモードでは白
- 文字: 数値は等幅(`font-mono` または `tabular-nums`)
- 余白: 行間広め、画像のような「ノートの抜け感」を意識
- アニメーション: 控えめ(transition は 200ms 程度)

## 実機確認(iPhone)

開発中はパソコンとiPhoneを同じWi-Fiにつないで、`npm run dev -- --host` で起動 → 表示されたIPアドレス(例: `http://192.168.1.10:5173`)をiPhoneのSafariで開く。

## 困ったとき

- 仕様が曖昧 → `SPEC.md` を読み直す。それでも不明なら作業を止めてユーザーに質問
- 型エラーで詰まる → 型定義を見直してから実装(any で逃げない)
- パフォーマンスが気になる箇所 → 計測してから直す。早期最適化しない
