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

- install: `pnpm install` 成功（workspace 全体、lockfile policy check 通過）
- lint: `pnpm --filter @coding-agent-basic/gpt-5-3-codex-002 lint` 成功（warning / error なし）
- typecheck: `pnpm --filter @coding-agent-basic/gpt-5-3-codex-002 typecheck` 成功
- test: `pnpm --filter @coding-agent-basic/gpt-5-3-codex-002 test` 成功（9 files, 37 tests passed）
- check: `pnpm --filter @coding-agent-basic/gpt-5-3-codex-002 check` 成功

## 変更ファイル

- `src/task1-parse-user.ts`
- `src/task2-purchases.ts`
- `src/task3-dashboards.ts`
- `src/task4-order-state.ts`
- `src/task5-registration.ts`
- `src/task6-price-cart.ts`
- `src/task7-postal-code.ts`
- `src/task8-rename-node.ts`
- `src/task9-create-session.ts`
- `EVALUATION.md`

## 設計方針

- Result / Option の使い方: 予期される失敗と nullable を値として返す。
- 副作用分離: fetch、stream、日時、乱数などの副作用を境界に寄せ、pure core を小さく保つ。
- 不変性: 入力を変更せず、返り値として新しい値を作る。
- 型設計: discriminated union と構造化エラーを使う。
- 非同期・Stream 処理: `Promise.all` と `pipeThrough` を中心に合成する。

## 宣言的に書けた点

- task1: field 単位 validator を合成し、複数エラーを配列で集約。
- task2: decode / split / parse / validate / filter / summarize を分離し、invalid line を値として処理。
- task3: user ごと・resource ごとの fetch を `Promise.all` で合成し、LoadError を構造化。
- task4: 状態遷移を discriminated union + exhaustive switch で定義。
- task5: 純粋な command plan を返し、副作用実行を分離。
- task6: `pricingRules` を実計算に利用し、割引上限を subtotal で段階適用。
- task7: Option helper と optional/nullish handling を合成。
- task8: 構造共有を維持する immutable update を再帰で実装。
- task9: 時刻・ID 生成を依存注入で決定的に実装。

## 妥協した点

- なし。

## 改善余地

- task3 に concurrency limit を追加可能な引数設計を導入すると大規模入力でより安定する。
- task6 の `PricingRule` にコンテキスト（残割引可能額など）を追加すると重複ルール制御をより明示化できる。

## AGENTS.md / SKILLS.md へのフィードバック

- `SKILLS.md` の task2（cancel/abort 伝播）と task6（discount cap の明示）が実装判断に有効だった。
- `CODING_TESTS.md` の完了コマンドが root 実行前提で明確なため、提出前検証フローを固定しやすかった。

## 残リスク

- task2: 非常に巨大な 1 行 JSON の場合、1 行分の文字列を保持する設計上メモリ使用量が増える。
- task3: 現在は userIds 全件を同時発行するため、入力件数が極端に大きいと API 側レート制限に抵触する可能性がある。

## レビュー所見

- ゲート条件: lint / typecheck / test / check は pass。lint warning なし。テスト改変なし。public API 互換も pass。
- 良い点: Raptor Mini で課題になった `pricingRules` の空 export は解消され、実際の計算フローで rule table を使っている。`discountTotal` も subtotal 上限を満たしている。
- 良い点: task3 は `for` / `push` の warning を出さず、typed validation と `flatMap` ベースの集約に寄せられている。
- 軽微な問題: 評価レポート冒頭にテンプレート由来の説明文が残っており、自己評価成果物としては少し雑に見える。
- 概算評価: 94 / 100。実装品質とゲート条件は良好。stream の巨大行メモリと async concurrency limit は残リスクとして妥当。

## テンプレートへのフィードバック

- `AGENTS.md` と `SKILLS.md` の責務分離は有効。共通原則を `AGENTS.md`、課題固有の注意を `SKILLS.md` に分けることで、lint warning や `pricingRules` の扱いが改善された。
- `EVALUATION.md` テンプレートには、実装後に導入文を置き換える指示を入れるとよい。
