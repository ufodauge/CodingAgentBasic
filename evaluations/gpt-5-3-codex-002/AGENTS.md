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
- `pnpm lint` が exit code 0 でも warning が残っている場合は未解消の問題として扱い、評価では減点対象にする。

## 共通コーディング原則

- 予期される失敗は `Result<T, E>` で返し、値が存在しない可能性は `Option<T>` で表す。
- 複数の validation error は配列などで蓄積し、最初の 1 件だけで処理を止めない。
- `unknown` は type guard や小さな validator で段階的に絞る。
- 配列操作は `map`、`filter`、`flatMap`、`reduce`、`toSorted`、`toReversed`、`toSpliced` などを優先する。
- `reduce` は濫用せず、読みにくい場合は意味のある helper 関数に分割する。
- 状態は discriminated union で表現し、状態遷移には exhaustive check を入れる。
- 独立した非同期処理は `Promise.all` で合成し、逐次実行が必要な場合は理由を明確にする。
- `AbortSignal` は fetch などの境界 API に伝播する。
- Web Stream API では parse error を stream 全体のクラッシュではなく値として流す。
- ビジネスロジックは pure core として実装し、DB / API / mail / logging などは imperative shell に隔離する。
- price breakdown や集計結果では、最終値だけでなく中間値の不変条件も守る。

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
- export した rule table や helper API を形だけ置き、実装で使わない。
- 検証用の一時スクリプトやログ出力を提出物に残す。

## 例外的に許容されるもの

- 関数内部に閉じた局所的な `let`。
- パフォーマンス上必要な局所的ミューテーション。
- 外部に漏れない `Map` / `Set` による内部集計。
- 境界層での最小限の `try-catch`。
- 外部ライブラリの型不足を補う最小限の型アサーション。

例外を使う場合も、入力を破壊せず、外部から観測可能な副作用を発生させず、型安全性を著しく損なわないこと。必要なら短いコメントで理由を説明する。
