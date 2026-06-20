# SKILLS.md

## 1. Result / Option を使ったエラー処理

- 予期される失敗は `Result<T, E>` で返す。
- 値が存在しない可能性は `Option<T>` で表す。
- `throw` は想定外のプログラミングエラーまたは境界層に限定する。
- 複数の validation error は配列として蓄積する。
- `map`、`flatMap`、`mapError`、`sequence` などの合成関数を活用する。

## 2. validator composition

- 大きな validator を一枚岩にしない。
- field ごとの小さな validator を作る。
- validation error は構造化する。
- `unknown` から段階的に型を絞る。
- 型アサーションではなく type guard を優先する。

## 3. immutable update

- 入力を直接変更しない。
- 配列操作は `map`、`filter`、`flatMap`、`reduce`、`toSorted`、`toReversed`、`toSpliced` を優先する。
- オブジェクト更新は spread または明示的な constructor を利用する。
- 深い更新では、変更が必要な部分だけ新しい参照を作る。

## 4. declarative data transformation

- データ変換を処理手順ではなく変換パイプラインとして表現する。
- 小さな純粋関数を合成する。
- ルールや分岐を可能な範囲でデータ構造として表現する。
- rule engine として `rules` / `pricingRules` などを export する場合は、空の飾りにせず実際の計算フローで使う。
- `reduce` は濫用せず、読みにくい場合は helper 関数を作る。
- price breakdown や集計結果では、最終値だけでなく中間値の不変条件も守る。例: `total` を 0 に丸めるだけでなく、`discountTotal` も実際に適用された上限内の値にする。

## 5. state machine modeling

- 状態は discriminated union で表現する。
- 不正状態を boolean flags で表現しない。
- 状態遷移は reducer または transition table として実装する。
- exhaustive check を入れる。
- 不正遷移は `Result` で返す。

## 6. async composition

- 独立した非同期処理は `Promise.all` で合成する。
- 逐次実行が必要な場合は理由を明確にする。
- `AbortSignal` を受け取り、fetch へ伝播する。
- エラーは構造化した `Result` として扱う。
- `try-catch` は境界で最小限に留める。

## 7. stream pipeline

- Web Stream API では `pipeThrough` / `pipeTo` を優先する。
- `TransformStream` を小さな部品として定義する。
- parse error は stream 全体のクラッシュではなく値として流す。
- back-pressure、cancel、abort、error propagation を考慮する。
- cancel / abort は型だけでは確認できないため、既存の受け入れテストで伝播を確認する。必要に応じて一時スクリプトで検証してもよいが、作業後に削除する。

## 8. pure core / imperative shell

- ビジネスロジックは pure core として実装する。
- DB / API / mail / logging などは imperative shell に隔離する。
- 副作用を直接実行せず、必要に応じて `Command` として記述する。
- テストは pure core を中心に行う。

## 9. lint / typecheck / test discipline

- lint error、lint warning、type error、test failure を残さない。
- 型エラーを `as any` で隠さない。
- lint rule を無効化しない。
- 既存テストを改変しない。
