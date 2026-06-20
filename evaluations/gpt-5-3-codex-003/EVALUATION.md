# Evaluation Report

`evaluations/gpt-5-3-codex-003` のコーディングテスト 9 課題を実装した。

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
pnpm check
```

実装中の検証として `pnpm check` を複数回実行し、lint / typecheck / test の指摘を修正した。

## 実行結果

- lint: pass (`eslint .`)
- typecheck: pass (`tsc --noEmit`)
- test: pass (`vitest run`, 9 files / 37 tests)
- check: pass (`pnpm lint && pnpm typecheck && pnpm test`)

## 設計方針

- Result / Option の使い方: validation、parse、fetch、状態遷移、rename not found を値として返した。
- 副作用分離: fetch、stream、日時、乱数を境界に置き、変換・検証・組み立てを小さな関数に分けた。
- 不変性: 入力の object / array / tree / cart を変更せず、新しい値または参照共有された値を返した。
- 型設計: state machine、command、pricing effect、load error を discriminated union で表現した。
- 非同期・Stream 処理: dashboard load は `Promise.all` で並列化し、JSON Lines は `TransformStream` で chunk 境界と cancel を扱った。

## 自己評価

- public API とテストを変更せず、9 課題すべてを実装した。
- `as any`、`eslint-disable`、テスト通過だけのハードコードは使っていない。
- 予期可能な失敗は `Result` または `undefined` として返し、入力ミューテーションを避けた。
- 一部の stream 境界では cancellation 伝播のために proxy `ReadableStream` / `WritableStream` を使ったため、純粋な `pipeThrough` 合成だけより実装量が増えた。

## 宣言的に書けた点

- task1 / task5 は field validator を合成し、validation error を配列として蓄積した。
- task2 は decode、line split、parse、validate、filter、summarize を関数単位で分離した。
- task3 は fetch、JSON parse、validation、dashboard 組み立てを分け、失敗を構造化して集約した。
- task4 は状態とイベントを discriminated union にし、不正遷移を `InvalidTransition` で返した。
- task6 は pricing rule の配列で適用順序を明示し、effect の型で discount / shipping / points を区別した。
- task8 は再帰的な immutable update で、変更のない枝の参照を維持した。

## 妥協した点

- `Result.inspect` がテストランナーの表示処理から引数なしで呼ばれる可能性に対応するため、実装を少し防御的にした。
- task2 の cancellation 伝播は Node の Web Stream 実装差を考慮して proxy を使った。仕様説明としてはコメントや helper 名をさらに洗練できる。
- task3 は全件並列で実行している。大量 user ID を扱う実運用では concurrency limit を追加できる構造にする余地がある。

## 改善余地

- Stream 課題では、`pipeThrough` のみでは runtime によって cancel propagation が期待どおりにならない場合があるため、必要なら proxy stream や abort 経路を明示する指針があるとよい。
- Result 型に `inspect` のような一般名メソッドを置く場合、テストランナーや Node の formatter と衝突し得るため、引数なし呼び出しへの耐性または別名化を検討するとよい。
- 非同期課題では、一部リソースの fetch が失敗しても、成功したレスポンスの validation error を可能な範囲で集約することを明示するとよい。

## AGENTS.md へのフィードバック

-

# Review

## 総合点

90 / 100

## ゲート条件

- lint: pass
- typecheck: pass
- test: pass
- テスト改変なし: pass
- public API 互換: pass

確認コマンド:

```bash
pnpm check
git -C C:/Users/hakka/Documents/Develop/CodingAgentBasic diff --no-index -- C:/Users/hakka/Documents/Develop/CodingAgentBasic/packages/template/test C:/Users/hakka/Documents/Develop/CodingAgentBasic/evaluations/gpt-5-3-codex-003/test
```

`pnpm check` は `eslint .`、`tsc --noEmit`、`vitest run` がすべて成功し、9 files / 37 tests が pass した。テストディレクトリはテンプレートとの差分なし。

## 観点別スコア

| 観点                               |  点数 | コメント                                                                                                                                            |
| ---------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 純粋性・副作用分離                 | 13/15 | 多くの課題で pure core を維持。`task2` の stream 集計は境界処理として妥当だが、可変配列への `push` が中心になっている。                             |
| 不変性・状態管理                   | 11/12 | 入力の破壊的変更は見当たらない。`task8` は参照共有もできているが、対象発見後も全兄弟を走査するため効率面に余地がある。                              |
| データ変換の宣言性                 | 10/12 | validator、pricing rule、async composition は宣言的。`task2` の集計と `task4` のネストした ternary はやや手続き的に読める。                         |
| エラー処理                         | 13/14 | validation、parse、network、HTTP、state transition を構造化エラーで扱えている。`task7` は API 制約上 `undefined` 返却で、欠損理由までは保持しない。 |
| 型設計                             | 13/14 | discriminated union と `Result` が適切。`task4` は state exhaustive はあるが event 側の網羅性は fallback invalid に寄っている。                     |
| 非同期・ストリーム・リソース管理   |  9/10 | `Promise.all`、`AbortSignal` 伝播、stream cancel 対応がある。大量 ID の concurrency limit は未実装だが拡張余地はある。                              |
| 可読性・実用性                     |  9/10 | 全体に小さな関数へ分割されていて保守しやすい。`task2` の proxy stream は複雑なので補助関数化または短い意図コメントがあるとさらによい。              |
| lint / typecheck / test discipline |   8/8 | lint / typecheck / test すべて pass。`as any`、`eslint-disable`、テスト改変は見当たらない。                                                         |
| 自己評価・フィードバック品質       |   4/5 | 実行結果と改善余地は具体的。ただし `AGENTS.md へのフィードバック` 欄が空欄に近い。                                                      |

## 良い点

- `task1` と `task5` は field validator を小さく分け、複数エラーを配列として蓄積している。
- `task3` は 1 ユーザー内の 3 API と複数ユーザーを自然に並列化し、network / abort / HTTP / parse / validation を区別している。
- `task4` は boolean flag を使わず、注文状態を discriminated union と `Result` で安全に扱っている。
- `task6` は pricing rule を配列化し、discount / shipping / points の effect を型で区別している。
- `task8` は `structuredClone` に逃げず、変更のない枝の参照を維持している。

## 問題点

- `task2` の `summarizePurchases` は stream の sink 境界とはいえ、局所可変配列への `push` による集計が中心で、宣言的な summary reducer としては弱い。
- `task4` は状態ごとの fallback で不正遷移を返しており、「すべての状態・イベントの組み合わせを明示的に扱う」という観点では event 側の網羅性がやや暗黙的。
- `task8` は対象ノードが先頭の枝に見つかっても全 children に対して再帰処理を行うため、大きな木では不要な走査が増える。
- `EVALUATION.md` の `AGENTS.md へのフィードバック` 欄が空で、次回の指示改善に直接使える形としては少し弱い。

## 命令的・非宣言的な箇所

### 箇所 1

```ts
const purchases: PurchaseEvent[] = [];
const invalidLines: InvalidLine[] = [];

// ...
if (result.ok) {
  purchases.push(result.value);
  return;
}

invalidLines.push(result.error);
```

理由:

stream の `WritableStream` 境界なので局所ミューテーション自体は許容できる。ただし、評価観点上は集計が可変状態に寄っており、データフローとして読める度合いが少し下がる。

改善案:

sink の内部状態を `PurchaseSummary` accumulator として明示し、更新を `appendPurchaseResult(summary, result)` のような純粋関数に切り出すと、imperative shell と pure update の境界がより明確になる。

### 箇所 2

```ts
case "draft":
	return event.type === "submit"
		? ok({ type: "submitted", submittedAt: event.at })
		: event.type === "cancel"
			? ok({ type: "cancelled", reason: event.reason })
			: invalidTransition(state, event);
```

理由:

有効遷移は読み取れるが、不正遷移は fallback にまとまっている。仕様の「すべての状態・イベントの組み合わせを明示的に扱う」に対しては、event の exhaustive check が弱い。

改善案:

状態ごとに `switch (event.type)` を入れる、または transition table を使い、各 event が valid / invalid のどちらとして扱われるかを明示する。

## 型安全性の問題

- `as any` や根拠のない型アサーションは見当たらない。
- `Result` は class union として十分に機能しているが、`IResult` 側に optional `value` / `error` があるため、型モデルとしては class の discriminant に依存している。実用上の問題はない。
- `task7` は戻り値が `string | undefined` のため、欠損理由までは型に残らない。public API 互換を守る判断としては妥当。

## エラー処理の問題

- 予期される失敗は概ね `Result` / `undefined` で返されている。
- `task2` の `JSON.parse` と `task3` の fetch / response parsing は境界で捕捉され、構造化エラーへ変換されている。
- `task3` は複数リソースの失敗を集約できており、成功したレスポンスの validation も可能な範囲で実施している。

## 副作用分離の問題

- `fetch`、stream、日時、乱数の副作用境界は明確。
- `task5` は command plan のみを生成し、DB / mailer / billing / logger を直接呼ばない。
- `task9` は `now` と `randomId` の依存性注入で決定的にテスト可能。

## AGENTS.md 改善提案

- stream の集計では、sink 境界で局所ミューテーションが必要になる場合でも、状態更新関数を純粋関数として切り出すと評価されやすい、と明記するとよい。
- state machine は状態側だけでなく event 側も `switch` または transition table で網羅する、という指針を追加するとよい。
- `EVALUATION.md` の `AGENTS.md へのフィードバック` 欄は空欄禁止にし、最低 1 つの具体的な改善提案を書くよう明示するとよい。
- deep immutable update では、参照共有だけでなく不要なサブツリー走査を避ける探索設計も評価対象だと追記するとよい。

## 次回のコーディングエージェントへの追加指示

- テンプレートにおいて、`task7` の戻り値が欠損理由を表せない形になっているが、これの方針を検討し修正する
- テストを通した後、`grep` で `push`, `as any`, `eslint-disable`, `throw`, `Date.now`, `Math.random`, `structuredClone` を確認し、残る場合は理由を `EVALUATION.md` に書くこと。
- stream 処理は `pipeThrough` / `pipeTo` を使いつつ、summary の状態更新を純粋 helper に切り出すこと。
- state machine は state と event の両方で網羅性が読める形にすること。
- 自己評価では `AGENTS.md` に反映すべきフィードバックを空欄にしないこと。