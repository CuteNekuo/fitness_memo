# セットアップ手順

Windowsパソコンで開発を始めるための手順。

## 0. 事前準備(初回のみ)

### Node.js のインストール
1. https://nodejs.org/ja から **LTS版** をダウンロード
2. インストーラーを実行(全部デフォルトでOK)
3. PowerShellを開いて確認:
   ```powershell
   node -v
   npm -v
   ```
   どちらもバージョン番号が出ればOK。

### Git のインストール
1. https://git-scm.com/download/win からダウンロード
2. インストール(全部デフォルトでOK)
3. PowerShell で確認: `git --version`

### Claude Code(すでに使ったことがあるならスキップ)
- 公式ドキュメントの手順でインストール済みであることを確認

## 1. このリポジトリを GitHub に上げる

### 1.1 ローカルでGit初期化
このフォルダを Claude が作って渡したzipから解凍して、PowerShellでそのフォルダに移動:

```powershell
cd path\to\workout-note
git init
git add .
git commit -m "Initial: spec and docs"
git branch -M main
```

### 1.2 GitHubで空リポジトリ作成
1. https://github.com/new を開く
2. Repository name: `workout-note`
3. Public か Private か選ぶ(自分用ならPrivateで可)
4. **README, .gitignore, license は何も追加しない**(既にローカルにあるため)
5. 「Create repository」

### 1.3 リモート登録 & プッシュ
GitHubの画面に出ているコマンドをコピペ。だいたいこんな感じ:

```powershell
git remote add origin https://github.com/<あなたのユーザー名>/workout-note.git
git push -u origin main
```

## 2. Claude Code で開発を始める

### 2.1 プロジェクトを開く
PowerShell で workout-note フォルダに移動して:

```powershell
cd path\to\workout-note
claude
```

### 2.2 最初の指示

Claude Code が起動したら、こうメッセージを送る:

```
このリポジトリの README.md, SPEC.md, CLAUDE.md, docs/TASKS.md を読んでください。
その上で、Phase 0 のタスクから順に実装を始めてください。
Phase の境目では必ず私に確認を取ってから次に進んでください。
```

これだけで Claude Code が:
1. 各ドキュメントを読み込む
2. Vite プロジェクトの初期化
3. 必要パッケージのインストール
4. PWA設定

を順にやってくれる。

## 3. 開発中の動作確認

### パソコンのブラウザで確認
```powershell
npm run dev
```
→ ブラウザで http://localhost:5173 を開く

### iPhone(同じWi-Fi)で確認
```powershell
npm run dev -- --host
```
→ 表示される `Network: http://192.168.x.x:5173` を iPhone Safari で開く

### iPhone のホーム画面に追加
1. Safari でアプリを開いた状態で、共有ボタンをタップ
2. 「ホーム画面に追加」を選ぶ
3. ホーム画面のアイコンをタップして起動

## 4. デプロイ(Phase 5で行う)

### Vercel にデプロイする手順(無料)
1. https://vercel.com にGitHubアカウントでログイン
2. 「Add New」→「Project」
3. workout-note リポジトリを選択
4. Framework Preset が自動で「Vite」になることを確認
5. 「Deploy」を押す

数分後に `https://workout-note-xxx.vercel.app` のような URL が発行される。
そのURLを iPhone Safari で開いて「ホーム画面に追加」すればどこからでもアクセスできる。

GitHub の main ブランチに push するたびに自動でデプロイされる。

## トラブル時

- `npm install` で失敗 → Node.js のバージョンを確認(v18以上)
- ポート 5173 が使用中 → 別のポートで起動: `npm run dev -- --port 3000`
- Claude Code が指示通り動かない → `CLAUDE.md` をもう一度読ませる
