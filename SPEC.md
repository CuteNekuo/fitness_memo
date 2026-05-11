# WorkoutNote 仕様書

## 1. プロダクト概要

筋トレの記録を「ノートに書きつける」感覚で残すPWA。
紙のトレーニングノートに近い情報密度の高いミニマルな表示を最優先する。

iPhoneのSafariからホーム画面に追加すれば、ネイティブアプリのような体験になる。

### デザインの参照イメージ

1日のビューは以下のフォーマットで縦に並ぶ。

```
2026/04/04

WRPD 60k
30k /14/12

DPS ±0k
/10/9/8

SR 52.5k
/12/10

FSMCP 30k
15k /10/10
```

各エントリーは2行(=2セル)で1種目を表す。

- **1行目**: `略称 + 本セット重量`(重量変動なしは `±0k`)
- **2行目**: `ウォームアップ重量 /レップ1/レップ2/...`(W無しは `-` または空欄)

## 2. データモデル

IndexedDB(Dexie.js)で永続化する。

### exercises(種目マスター)

| フィールド | 型 | 説明 |
|---|---|---|
| id | string (uuid) | 主キー |
| abbreviation | string | 略称(例: `WRPD`)。一意インデックス |
| fullName | string | 正式名称 |
| defaultWeight | number? | 初期表示用デフォルト本セット重量(kg) |
| defaultWarmupWeight | number? | 初期表示用ウォームアップ重量(kg) |
| memo | string? | 自由メモ |
| createdAt | number | UNIX ms |
| updatedAt | number | UNIX ms |

### routines(ルーティンテンプレ)

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 主キー |
| name | string | テンプレ名(例: 「背中の日」) |
| exerciseIds | string[] | Exercise.id の順序付き配列 |
| order | number | 並び順 |

### workoutDays(1日の記録)

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 主キー |
| date | string | `YYYY-MM-DD` 形式。一意インデックス |
| note | string? | 1日全体のメモ |

### exerciseEntries(種目1つ分の記録)

| フィールド | 型 | 説明 |
|---|---|---|
| id | string | 主キー |
| workoutDayId | string | WorkoutDay.id への参照(インデックス) |
| exerciseId | string | Exercise.id への参照(インデックス) |
| order | number | 1日の中での並び順 |
| mainWeight | number | 本セット重量(kg) |
| weightDelta | string? | `±0k` `-2.5k` など表示用差分(任意) |
| warmupWeight | number? | ウォームアップ重量(kg)。null は省略表示 |
| reps | number[] | 各セットのレップ数 |
| memo | string? | このエントリーへのメモ |

## 3. 画面構成

ルーティングは `react-router-dom` で実装。

### 3.1 メイン: 1日ビュー(`/` or `/day/:date`)

- 上部: 日付(`YYYY/MM/DD`)、左右スワイプで前後の日に移動
- 中部: ExerciseEntry のリスト(画像のフォーマットで表示)
- 下部: ボトムバー
  - 種目追加ボタン
  - ルーティン適用ボタン
  - メモボタン
  - 入力モード切り替え(フォーム ⇄ テキスト)
  - ビュー切り替え(1日 / 週 / グラフ)

### 3.2 週一覧ビュー(`/week/:isoWeek`)

- 7日分を横並び(曜日カラム)
- 各カラムにその日の種目略称をコンパクト表示
- カラムタップで該当日の DailyView へ遷移

### 3.3 種目別グラフ(`/chart/:exerciseId`)

- 種目を選択 → その種目の本セット重量推移を Recharts で
- 期間切り替え(1ヶ月 / 3ヶ月 / 6ヶ月 / 1年)

### 3.4 種目マスター管理(`/exercises`)

- 登録済み種目一覧
- 追加・編集・削除
- 略称の重複チェック

### 3.5 ルーティンテンプレ管理(`/routines`)

- テンプレ一覧
- 種目をドラッグで並べ替え追加

### 3.6 設定(`/settings`)

- デフォルト入力モード(フォーム / テキスト)
- データエクスポート(JSON)
- データインポート(JSON)
- データ全消去

## 4. 入力モード

### 4.1 フォームモード

ExerciseEntry の追加・編集 UI:

- 種目略称入力 + 既存種目補完
- 本セット重量(数値入力)
- ウォームアップ重量(数値入力、空欄可)
- レップ配列(`+` ボタンでセット追加、各セットは数値入力)

### 4.2 テキスト直書きモード

エントリーを画像と同じフォーマットの生テキストとして直接編集:

```
WRPD 60k
30k /14/12
```

パース規則:
- 1行目: `[略称] [数値]k`(`±` `+` `-` プレフィクス可)
- 2行目: `[数値]k? /[数値]/[数値]/...`(先頭の `-` はW無しを意味する)

略称が未登録なら自動で `Exercise` を新規作成(fullNameは空)。

両モードはエントリー単位で切り替え可能。デフォルトは設定画面で選べる。

## 5. 種目略称の入力補助

- フォーム入力中、略称テキストフィールドにオートコンプリート
- 過去使用した略称を頻度順で候補表示
- 新規略称はその場で `Exercise` を作成(後で正式名称を補完)

## 6. ルーティンテンプレの動作

- 「ルーティン適用」ボタン → テンプレ一覧モーダル
- 選択するとそのテンプレに含まれる Exercise が
  デフォルト重量込みで ExerciseEntry として一括追加される
- 既存エントリーには追記、上書きはしない

## 7. PWA要件

- `manifest.json`: アプリ名、アイコン(192/512px)、テーマカラー、`display: "standalone"`
- Service Worker でアセットキャッシュ → オフライン動作
- iOS Safari からホーム画面追加で動く(`apple-touch-icon` 必須)
- インストールバナー表示(対応ブラウザのみ)

## 8. 非機能要件

- 初回ロード後はオフラインで完全動作
- データはブラウザ内 IndexedDB に保存(クリアされない限り永続)
- ダークモード前提デザイン(画像と同じ黒背景)、ライトモードも対応
- モバイルファースト(iPhone 縦持ち想定、横画面はとりあえず未対応でOK)
- バックアップ: 設定画面から JSON エクスポート可能(ユーザーが手動で行う)

## 9. 将来の拡張(スコープ外)

- クラウド同期(Firebase等)
- 共有/SNS連携
- ボリューム自動計算(重量 × レップ合計)
- 1RM推定
- ネイティブアプリ化(Capacitor等で iOS/Android パッケージ)

## 10. ディレクトリ構成

```
workout-note/
├── public/
│   ├── icons/                    # PWAアイコン
│   └── ...
├── src/
│   ├── main.tsx                  # エントリ
│   ├── App.tsx                   # ルーティング
│   ├── db/
│   │   ├── schema.ts             # Dexie テーブル定義
│   │   └── repository.ts         # CRUD関数
│   ├── components/
│   │   ├── daily/
│   │   │   ├── DailyView.tsx
│   │   │   ├── EntryRow.tsx
│   │   │   └── EntryEditor.tsx
│   │   ├── week/
│   │   │   └── WeekView.tsx
│   │   ├── charts/
│   │   │   └── ExerciseChart.tsx
│   │   ├── exercises/
│   │   │   └── ExerciseList.tsx
│   │   ├── routines/
│   │   │   └── RoutineList.tsx
│   │   ├── settings/
│   │   │   └── Settings.tsx
│   │   └── shared/
│   │       └── ...
│   ├── lib/
│   │   ├── parser.ts             # テキストモードのパース
│   │   └── date.ts               # 日付ユーティリティ
│   ├── hooks/
│   │   └── ...
│   └── styles/
│       └── index.css             # Tailwind エントリ
├── tests/
│   └── parser.test.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```
