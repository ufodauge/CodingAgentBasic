# Evaluation Report

このファイルは評価実行後に記入するためのテンプレートです。
`packages/template` では各課題の public API とテストだけを配置し、実装は `Not Implemented` のプレースホルダにしています。
そのため、コピー直後の `pnpm test` は失敗するのが正常です。各課題を実装したあとに結果を記録してください。
実装対象の詳細は `CODING_TESTS.md` を参照してください。

## 実装対象

- [x] 1: バリデーションを Result で返す
- [x] 2: Web Stream API による JSON Lines 処理
- [x] 3: 非同期 API 呼び出しを ResultAsync 的に合成する
- [x] 4: 状態機械を discriminated union で表現する
- [x] 5: 副作用を持つ処理を「計画」と「実行」に分離する
- [x] 6: ルールエンジン的な割引計算
- [x] 7: Option / nullable を安全に扱う
- [x] 8: Deep Immutable Update
- [x] 9: Deterministic Domain Logic

## 実行コマンド

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

## 実行結果

- install: success（`pnpm install` 完了。依存解決は最新で追加インストールなし）
- lint: success（`pnpm --filter @coding-agent-basic/gpt-5-3-run-001 lint`）
- typecheck: success（`pnpm --filter @coding-agent-basic/gpt-5-3-run-001 typecheck`）
- test: success（`pnpm --filter @coding-agent-basic/gpt-5-3-run-001 test`、37/37 passed）
- check: success（`pnpm --filter @coding-agent-basic/gpt-5-3-run-001 check`）

## 設計方針

- Result / Option の使い方: 予期される失敗と nullable を値として返す。
- 副作用分離: fetch、stream、日時、乱数などの副作用を境界に寄せ、pure core を小さく保つ。
- 不変性: 入力を変更せず、返り値として新しい値を作る。
- 型設計: discriminated union と構造化エラーを使う。
- 非同期・Stream 処理: `Promise.all` と `pipeThrough` を中心に合成する。

## 宣言的に書けた点

- task2 は decode/line split/parse/validate/filter/summarize を分割し、`Result` のストリームとして合成した。
- task3 は fetch・レスポンス検証・ダッシュボード組み立てを分離し、ユーザー単位・リソース単位の並列化とエラー集約を実装した。
- task6 は `readonly PricingRule[]` でルールを独立定義し、効果（discount/shipping/points）を型で区別した。

## 妥協した点

- task3 の concurrency limit は未導入（導入しやすい構造にはしている）。

## 改善余地

- task3 に同時実行数制限と retry policy を追加すると、大規模入力時の安定性を高められる。
- task2 の invalid line メッセージを機械可読コード化すると、運用時の集計がしやすい。

## AGENTS.md / SKILLS.md へのフィードバック

- `Result` ベースでの失敗表現、入力不変、pure core の方針が実装判断に一貫して効いた。
- Stream の cancel 伝播要件はランタイム依存差が出やすいため、`CODING_TESTS.md` に補足があると初回実装の手戻りを減らせる。
