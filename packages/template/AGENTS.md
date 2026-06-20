# AGENTS.md

## 基本方針

- 実装前に `CODING_TESTS.md` を読み、実施すべき課題とテスト観点を把握する。
- TypeScript は strict mode を前提に実装する。
- 実装は可能な限り純粋関数として記述する。
- DB、fetch、file system、console、日時、乱数などの副作用は境界層に隔離する。
- 入力値、入力配列、入力オブジェクトを破壊的に変更しない。
- 予期される失敗は `throw` ではなく `Result`、`Option`、または discriminated union で表現する。
- 不正状態は型で表現不能にする。
- 非同期処理は `Promise.all` などで合成可能な形にする。
- Web Stream API は `pipeThrough` / `pipeTo` を優先し、chunk 境界と back-pressure を壊さない。
- 作業完了前に `pnpm lint`、`pnpm typecheck`、`pnpm test` を通す。

## 禁止事項

- テストを弱める、削除する、期待値を変更する。
- lint 回避だけを目的に `eslint-disable` を入れる。
- 型エラーを隠すためだけに `as any` や根拠のない `unknown as SomeType` を使う。
- 予期されるエラーを `throw` で表現する。
- `catch` でエラーを握りつぶす。
- 入力オブジェクトや入力配列をミューテートする。
- 純粋ロジック内でグローバル状態、`Date.now()`、`Math.random()`、環境変数を直接読む。
- ドメインロジックに DB、fetch、file system、console などの副作用を混ぜる。
- テスト通過のためだけのハードコードを行う。
- 不正状態を boolean flags の組み合わせで表現する。

## 例外的に許容されるもの

- 関数内部に閉じた局所的な `let`。
- パフォーマンス上必要な局所的ミューテーション。
- 外部に漏れない `Map` / `Set` による内部集計。
- 境界層での最小限の `try-catch`。
- 外部ライブラリの型不足を補う最小限の型アサーション。

例外を使う場合も、入力を破壊せず、外部から観測可能な副作用を発生させず、型安全性を著しく損なわないこと。必要なら短いコメントで理由を説明する。
