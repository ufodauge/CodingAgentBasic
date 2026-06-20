# Evaluation Report

このファイルは評価実行後に記入するためのテンプレートです。
`packages/template` では各課題の public API とテストだけを配置し、実装は `Not Implemented` のプレースホルダにしています。
そのため、コピー直後の `pnpm test` は失敗するのが正常です。各課題を実装したあとに結果を記録してください。
実装対象の詳細は `CODING_TESTS.md` を参照してください。

## 実装対象

- [ ] 1: バリデーションを Result で返す
- [ ] 2: Web Stream API による JSON Lines 処理
- [ ] 3: 非同期 API 呼び出しを ResultAsync 的に合成する
- [ ] 4: 状態機械を discriminated union で表現する
- [ ] 5: 副作用を持つ処理を「計画」と「実行」に分離する
- [ ] 6: ルールエンジン的な割引計算
- [ ] 7: Option / nullable を安全に扱う
- [ ] 8: Deep Immutable Update
- [ ] 9: Deterministic Domain Logic

## 実行コマンド

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

## 実行結果

- install:
- lint:
- typecheck:
- test: 未実装テンプレートでは `Not Implemented` により fail。実装後に更新する。
- check: 未実装テンプレートでは test fail により fail。実装後に更新する。

## 設計方針

- Result / Option の使い方: 予期される失敗と nullable を値として返す。
- 副作用分離: fetch、stream、日時、乱数などの副作用を境界に寄せ、pure core を小さく保つ。
- 不変性: 入力を変更せず、返り値として新しい値を作る。
- 型設計: discriminated union と構造化エラーを使う。
- 非同期・Stream 処理: `Promise.all` と `pipeThrough` を中心に合成する。

## 宣言的に書けた点

-

## 妥協した点

-

## 改善余地

-

## AGENTS.md / SKILLS.md へのフィードバック

-
