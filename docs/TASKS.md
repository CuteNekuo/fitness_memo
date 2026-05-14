# 実装タスクリスト

Phase ごとに段階的に進める。各 Phase の最後でユーザーに動作確認してもらってから次へ。

---

## Phase 0: プロジェクト初期化

### 0.1 環境構築
- [x] `npm create vite@latest . -- --template react-ts` で Vite + React + TS プロジェクト作成
- [x] Tailwind CSS をセットアップ(`tailwindcss`, `postcss`, `autoprefixer`)
- [x] `react-router-dom`, `dexie`, `recharts`, `vite-plugin-pwa` をインストール
- [x] `vitest` を dev dependency でインストール
- [x] `.gitignore` に `node_modules/`, `dist/`, `.DS_Store` 等
- [ ] `npm run dev` で初期画面が出ることを確認

### 0.2 PWA セットアップ
- [x] `vite.config.ts` に `vite-plugin-pwa` 設定
- [x] `manifest.json` 相当をプラグイン設定に記述(name, short_name, theme_color, background_color)
- [x] アイコンプレースホルダ(192px, 512px, apple-touch-icon)を `public/icons/` に
- [x] `display: "standalone"`, `start_url: "/"` を確認
- [ ] iPhone Safari で「ホーム画面に追加」して動くことを確認

✅ Phase 0 完了 → ユーザーに確認

---

## Phase 1: 最小動作版(MVP)

「画像の通りに見えて、入力もできて、保存される」状態を目指す。

### 1.1 データ層
- [x] `src/db/schema.ts` で Dexie テーブル定義
- [x] `src/db/repository.ts` で CRUD 関数群を作る(getWorkoutDay, upsertEntry など)
- [x] 日付正規化ユーティリティ `src/lib/date.ts`

### 1.2 1日ビュー(表示のみ)
- [x] `src/components/daily/DailyView.tsx` の骨格
- [x] 日付ヘッダー(`YYYY/MM/DD`)+ 左右スワイプ/ボタンで前後日に移動
- [x] `src/components/daily/EntryRow.tsx` で画像のフォーマットを再現
- [x] サンプルデータで表示確認

### 1.3 エントリー追加(フォームモード)
- [x] `src/components/daily/EntryEditor.tsx`(モーダル/シート)
- [x] 種目略称入力 + 既存種目補完(過去の Exercise から)
- [x] 本セット重量、ウォームアップ重量、レップ配列の入力
- [x] 保存で `exerciseEntries` に追加 → `workoutDays` がなければ作成
- [x] 削除(スワイプ or 長押し)、編集(タップ)

### 1.4 動作確認
- [ ] iPhone Safari でホーム画面追加 → 一連の流れが動く
- [ ] アプリ再起動後もデータが残る
- [ ] オフラインで動作する

✅ Phase 1 完了 → ユーザーに確認

---

## Phase 2: テキスト入力モード + 種目辞書

### 2.1 テキストパーサー
- [x] `src/lib/parser.ts` 実装
- [x] `tests/parser.test.ts` でケース網羅
  - 通常: `WRPD 60k\n30k /14/12`
  - W無し: `DPS ±0k\n/10/9/8`
  - W無し明示: `DPCF 30k\n- /12/10`
  - 異常系: 不正な数値、空文字、フォーマット崩れ

### 2.2 入力モード切り替え
- [x] `EntryEditor` にモード切り替えトグル
- [x] テキストモード時は単一の `<textarea>`
- [x] 保存時にパース → 失敗時はエラー表示
- [ ] 設定でデフォルトモードを保存(localStorage)

### 2.3 種目マスター画面
- [x] `src/components/exercises/ExerciseList.tsx`
- [x] 略称・正式名称・デフォルト重量の編集
- [x] 略称の重複バリデーション
- [x] 削除時に使用中エントリーへの影響を警告

✅ Phase 2 完了 → ユーザーに確認

---

## Phase 3: ルーティンテンプレ

### 3.1 ルーティン管理画面
- [x] `src/components/routines/RoutineList.tsx`
- [x] テンプレ作成・編集・削除
- [x] 種目追加(マスターから選択)、↑↓ボタンで並べ替え

### 3.2 ルーティン適用
- [x] DailyView のツールバーに「適用」ボタン
- [x] 選択 → その日の WorkoutDay にエントリー一括追加
- [x] デフォルト重量を初期値として埋める

✅ Phase 3 完了 → ユーザーに確認

---

## Phase 4: 週ビュー + グラフ

### 4.1 週一覧ビュー
- [x] `src/components/week/WeekView.tsx`
- [x] 7日横並び、各カラムに種目略称コンパクト表示
- [x] カラムタップで該当日の DailyView へ遷移
- [x] 週送り(左右ボタン)

### 4.2 種目別グラフ
- [x] `src/components/charts/ExerciseChart.tsx`
- [x] 種目選択 → 本セット重量推移を Recharts で
- [x] 期間切り替え(1ヶ月 / 3ヶ月 / 6ヶ月 / 1年)

### 4.3 ビュー切り替え
- [x] DailyView / WeekView / ChartView / 設定 をボトムナビで切り替え

✅ Phase 4 完了 → ユーザーに確認

---

## Phase 5: 設定 + 仕上げ

### 5.1 設定画面
- [x] `src/components/settings/Settings.tsx`
- [ ] デフォルト入力モード切り替え
- [x] データエクスポート(全データを JSON ダウンロード)
- [x] データインポート(JSON 読み込み)
- [x] データ全消去(確認ダイアログ付き)

### 5.2 仕上げ
- [ ] 空状態のメッセージ
- [ ] エラー時のリカバリーUI
- [ ] アクセシビリティ(キーボード操作、aria-label)
- [ ] パフォーマンス: 1000日分のデータでスクロール検証
- [ ] アイコンを正式版に差し替え

### 5.3 デプロイ
- [ ] Vercel または Cloudflare Pages にデプロイ
- [ ] HTTPS で配信されることを確認(PWAに必須)
- [ ] 本番URLをiPhoneでホーム画面追加して動作確認

✅ Phase 5 完了 → リリース!

---

## 将来 Phase(別途相談)

- クラウド同期
- Apple Health / Google Fit 連携
- ボリューム計算 / 1RM推定
- Capacitor でネイティブアプリ化(App Store / Google Play)
