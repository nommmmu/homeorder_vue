# HomeOrder Vue Frontend

Vue 3 + TypeScript + Vite を使用したHomeOrderのフロントエンドアプリケーション。

## 技術スタック

- **Vue 3** - Composition API
- **TypeScript** - 型安全性
- **Vite** - 高速な開発サーバー
- **Pinia** - 状態管理
- **Vue Router** - ルーティング
- **Axios** - HTTP クライアント

## 必要条件

- Docker & Docker Compose
- Laravel バックエンドが起動していること

## クイックスタート

### 1. Laravel バックエンドを起動

```bash
cd ../app
docker compose up -d
```

### 2. Vue フロントエンドを起動

```bash
# Dockerネットワークを作成（初回のみ）
docker network create app_homeorder-network 2>/dev/null || true

# コンテナを起動
make up

# または
docker compose up -d
```

### 3. ブラウザでアクセス

http://localhost:5173

## Makeコマンド

```bash
make help        # ヘルプを表示
make up          # コンテナを起動
make down        # コンテナを停止
make build       # コンテナをビルド
make rebuild     # 再ビルドして起動
make logs        # ログを表示
make shell       # コンテナ内でシェルを開く
make install     # npm依存関係をインストール
make dev         # 開発サーバーを起動してログを表示
make build-prod  # 本番用ビルド
make type-check  # TypeScript型チェック
make lint        # ESLintを実行
make status      # コンテナの状態を表示
```

## プロジェクト構造

```
vue/
├── src/
│   ├── api/           # API クライアント
│   │   └── client.ts  # Axios 設定とAPI関数
│   ├── assets/        # 静的ファイル
│   │   └── main.css   # グローバルスタイル
│   ├── components/    # 共通コンポーネント
│   ├── router/        # Vue Router 設定
│   │   └── index.ts
│   ├── stores/        # Pinia ストア
│   │   └── auth.ts    # 認証ストア
│   ├── types/         # TypeScript 型定義
│   │   └── index.ts
│   ├── views/         # ページコンポーネント
│   │   ├── HomeView.vue
│   │   ├── LoginView.vue
│   │   ├── SignupView.vue
│   │   ├── RecipesView.vue
│   │   ├── RecipeDetailView.vue
│   │   ├── MealPlansView.vue
│   │   └── RequestsView.vue
│   ├── App.vue        # ルートコンポーネント
│   └── main.ts        # エントリーポイント
├── public/            # 静的アセット
├── Dockerfile
├── docker-compose.yml
├── vite.config.ts
└── package.json
```

## API通信

ViteのプロキシでAPIリクエストを Laravel バックエンドに転送します。

- フロントエンド: `http://localhost:5173`
- API (プロキシ経由): `/api/*` → `http://homeorder-nginx:80/api/*`

## 環境変数

| 変数 | 説明 | デフォルト |
|------|------|---------|
| `VITE_API_URL` | API ベースURL | `http://homeorder-nginx:80` |

## 機能

- **認証**: ログイン、新規登録、ログアウト
- **レシピ管理**: 一覧、詳細、作成、いいね
- **献立計画**: 日付別の献立管理
- **リクエスト**: 食べたいものリクエスト

## 開発

### ローカルで実行（Docker なし）

```bash
npm install
npm run dev
```

### ビルド

```bash
npm run build
```

### 型チェック

```bash
npm run type-check
```

## トラブルシューティング

### ネットワークエラー

Laravel コンテナと同じネットワークに接続されているか確認:

```bash
docker network ls
docker network inspect app_homeorder-network
```

### API接続エラー

1. Laravel バックエンドが起動しているか確認
2. `docker compose logs` でエラーを確認
3. ブラウザの開発者ツールでネットワークエラーを確認
