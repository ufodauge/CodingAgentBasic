---
name: AGENT.md evaluation
description: AGENT.md の性能をコーディングテストを通じて評価するエージェント
tools: [vscode, execute, read, agent, edit, search, web, todo]
model: GPT-5.5 (openai)
---

# TypeScript 宣言的コーディングエージェント評価プロジェクト仕様

## 目的

TypeScript を利用するプロジェクトにおいて、コーディングエージェントが以下の観点を守るような `AGENTS.md` を整備する。

- 純粋性・副作用の分離
- 不変性・状態管理
- データ変換の宣言性
- エラー処理
- 型設計
- 非同期・ストリーム・リソース管理
- 可読性・実用性
- lint ルールの厳守
- typecheck の通過
- test の通過

そのうえで、実際にサブエージェント（GPT-5.3-Codex）に `AGENTS.md` を利用させ、定性的な評価を行う。

評価はエージェント向けコーディングテストによって行う。

反省点はフィードバックとして `AGENTS.md` を修正するために利用する。
なお `AGENTS.md` は汎用的な TypeScript プロジェクトで使えることをある程度前提とし、コーディングテスト固有のドメイン知識は含めない。

エージェントは `evaluations` ディレクトリにプロジェクトを pnpm のワークスペースとして作成し、そこで指定されたコーディングテストを実施する。

`packages/template` ディレクトリには、あらかじめ以下を含むコピー用プロジェクトを配置する。

- `Result` 型
- テストランナー設定
- lint 設定
- TypeScript strict 設定
- 各課題の雛形
- 各課題の単体テスト
- 必要に応じたテスト用 fake fetch / stream utility

---

## プロジェクトセットアップ要件

エージェントは以下の手順で評価用プロジェクトを作成すること。

### 1. 評価プロジェクトの作成

`packages/template` をコピーし、以下のようなディレクトリを作成する。

```txt
evaluations/
  <agent-name-or-run-id>/
    package.json
    tsconfig.json
    eslint.config.js
    src/
    test/
    AGENTS.md
    EVALUATION.md
```

例:

```txt
evaluations/agent-run-001/
```

### 2. 必須コマンド

エージェントは作業完了前に以下を実行し、成功させること。

```bash
pnpm check
```

### 3. 提出物

評価用プロジェクトには最低限以下を含める。

```txt
AGENTS.md
EVALUATION.md
src/
test/
package.json
tsconfig.json
eslint.config.js
```

`EVALUATION.md` には以下を記載する。

- 実装した課題一覧
- 実行したコマンド
- lint / typecheck / test の結果
- 自己評価
- 宣言的に書けた点
- 改善余地
- `AGENTS.md` に反映すべきフィードバック

## 評価観点

評価は 100 点満点で行う。

ただし、以下のゲート条件を満たさない場合は、原則として大幅減点または不合格とする。

### ゲート条件

以下は必須。

- `pnpm lint` が成功する
- `pnpm typecheck` が成功する
- `pnpm test` が成功する
- 課題で指定された public API を変更しない
- テストを削除・弱体化・改変しない
- 実装をハードコードでごまかさない
- `AGENTS.md` を作成している
- `EVALUATION.md` を作成している

### 採点基準

#### 1. 純粋性・副作用分離: 15 点

- 同じ入力に対して同じ出力を返す純粋関数が中心になっている: 4
- 外部状態への読み書きがロジックに混入していない: 3
- DB / fetch / console / Date / random などの副作用が境界に分離されている: 3
- pure core / imperative shell の分離ができている: 3
- テストしやすい単位に分割されている: 2

#### 2. 不変性・状態管理: 12 点

- 入力オブジェクト・入力配列をミューテートしていない: 4
- 状態更新が新しい値の生成として表現されている: 3
- 状態遷移が局所化・明示化されている: 2
- 参照共有や部分更新を適切に扱っている: 2
- 必要な局所ミューテーションが外部に漏れていない: 1

#### 3. データ変換の宣言性: 12 点

- `map`, `filter`, `flatMap`, `reduce`, `pipe` などを適切に使っている: 3
- 処理がデータフローとして読める: 3
- 小さな関数を合成している: 3
- ルールや分岐がデータ構造として表現されている: 2
- `reduce` を不必要に濫用していない: 1

#### 4. エラー処理: 14 点

- 予期される失敗を `throw` ではなく `Result` で返している: 4
- nullable な値を明示的な型で扱っている: 2
- エラー型が具体的で構造化されている: 3
- validation error を複数蓄積できている: 2
- `catch` でエラーを握りつぶしていない: 2
- 想定外エラーと想定内エラーを区別している: 1

#### 5. 型設計: 14 点

- discriminated union を適切に使っている: 3
- 不正状態を表現不能にしている: 4
- `unknown` から安全に型を絞っている: 2
- exhaustive check がある: 2
- `any` や根拠のない型アサーションに頼っていない: 2
- API の入出力型が明確である: 1

#### 6. 非同期・ストリーム・リソース管理: 10 点

- 独立した非同期処理を合成的・並列的に扱っている: 2
- `AbortSignal` を適切に伝播している: 2
- Stream を pipeline として扱っている: 2
- parse error / network error を値として扱っている: 2
- cancel / back-pressure / resource cleanup を考慮している: 2

#### 7. 可読性・実用性: 10 点

- 命名が明確で意図が読み取りやすい: 2
- 過剰な抽象化を避けている: 2
- 関数やモジュールの責務が明確である: 2
- パフォーマンス上明らかに不利な実装を避けている: 2
- 実務で保守可能な設計になっている: 2

#### 8. lint / typecheck / test discipline: 8 点

- lint が通る: 2
- typecheck が通る: 2
- test が通る: 2
- lint disable / `as any` / テスト改変などの回避策を使っていない: 2

#### 9. 自己評価・フィードバック品質: 5 点

- `EVALUATION.md` に実行結果が記録されている: 1
- 宣言的に書けた点が具体的に記載されている: 1
- 改善点が具体的に記載されている: 1
- `AGENTS.md` への改善提案がある: 1
- 次回のエージェント実行に有用な反省になっている: 1

---

## 評価時の注意点

### `let` や `for` の有無だけで機械的に評価しない

`let` や `for` は命令的な兆候ではあるが、存在するだけで即失格とはしない。

ただし、以下は減点対象とする。

- 外部状態を更新している
- 入力をミューテートしている
- accumulator を破壊的に更新している
- 処理全体が手続き的でデータフローが読み取れない
- `for` と `push` による集計が中心になっている

一方、以下は許容される場合がある。

- 関数内部に閉じた一時変数
- パフォーマンス上必要な局所的集計
- 外部に漏れない builder 的なミューテーション
- Stream や低レベル API の境界処理

### `reduce` の使用だけで加点しない

`reduce` を使っていても、以下のような実装は宣言的とは評価しない。

```ts
items.reduce((acc, item) => {
  acc.push(transform(item));
  return acc;
}, []);
```

評価すべきなのは、`reduce` の有無ではなく以下である。

- データ変換の意図が読みやすいか
- accumulator を破壊していないか
- `map` / `filter` / `flatMap` で十分な処理を無理に `reduce` にしていないか
- helper 関数に分割されているか

### `throw` の扱い

ドメイン上予期される失敗は `throw` ではなく `Result` で表現する。

例:

- validation error
- parse error
- not found
- invalid transition
- external API failure
- nullable / missing field

一方、プログラミングエラーや到達不能分岐では `assertNever` などを使ってよい。

---

## エージェント向けコーディングテスト評価ポイント

### 1: バリデーションを Result で返す

#### 減点対象

```ts
if (...) throw new Error(...)
```

```ts
const errors = [];
errors.push(...);
```

```ts
input.name = input.name.trim();
```

```ts
const user = input as User;
```

#### 加点対象

- `Result` を使う
- validator の合成がある
- エラー型が具体的
- validation error を蓄積している
- `unknown` から安全に型を絞っている
- `readonly` な入力を想定している
- field ごとの validator が独立している

---

### 2: Web Stream API による JSON Lines 処理

#### 減点対象

- `while (true)` で reader を直接回す
- `let total = 0` を外側で更新し続ける
- `JSON.parse` の例外が外に漏れる
- 不正行で処理全体をクラッシュさせる
- stream の cancel / error を考慮しない
- chunk 境界を無視して `chunk.split('\n')` だけで処理する

#### 加点対象

- `pipeThrough` / `pipeTo` によるパイプライン
- `TransformStream` の小さな部品化
- parse error を `Result` として流す
- データフローが読みやすい
- back-pressure を壊さない
- 改行分割 stream が chunk 境界を正しく扱う
- parse / validate / filter / summarize が分離されている

---

### 3: 非同期 API 呼び出しを ResultAsync 的に合成する

#### 減点対象

```ts
const results = [];

for (const id of userIds) {
  const user = await fetchUser(id);
  const orders = await fetchOrders(id);
  const recs = await fetchRecommendations(id);
  results.push({ user, orders, recs });
}
```

```ts
try {
  ...
} catch (e) {
  return null;
}
```

```ts
catch {
  return { ok: false, error: [] };
}
```

#### 加点対象

```ts
await Promise.all(userIds.map(loadDashboard));
```

- `Result` / `ResultAsync` で合成している
- エラー情報が構造化されている
- 並列性が自然に表現されている
- 副作用境界と純粋変換が分離されている
- `AbortSignal` を fetch へ伝播している
- ネットワークエラー、HTTP エラー、parse エラー、validation エラーを区別している
- 必要なら concurrency limit を導入できる設計になっている

---

### 4: 状態機械を discriminated union で表現する

#### 減点対象

```ts
type Order = {
  isDraft: boolean;
  isPaid: boolean;
  isShipped: boolean;
  isCancelled: boolean;
};
```

```ts
state.type = "paid";
```

```ts
return { ...state, type: event.type as any };
```

#### 加点対象

- discriminated union
- exhaustive check
- 遷移表または reducer として実装
- 不正状態を型で排除
- `InvalidTransition` に現在状態とイベントが含まれている
- 時刻や tracking number などの event payload を正しく使用している

---

### 5: 副作用を持つ処理を「計画」と「実行」に分離する

#### 減点対象

```ts
await db.users.insert(...)
await mailer.send(...)
await billing.createCustomer(...)
```

をビジネスロジック内で直接呼ぶ。

```ts
input.email = input.email.toLowerCase();
```

#### 加点対象

- 純粋関数で command を生成
- 副作用実行層とロジック層が分離
- テストしやすい
- エラーも値として返す
- `plan` による分岐がデータ構造として読みやすい
- command を実行する interpreter を別に定義できる設計
- command の型が網羅的に扱える

---

### 6: ルールエンジン的な割引計算

#### 減点対象

```ts
let total = 0;
let discount = 0;

for (...) {
  if (...) {
    discount += ...
  }
}
```

```ts
cart.items[i].price = discountedPrice;
```

#### 加点対象

- 割引ルールを関数やデータの配列として表現
- `rules.map(rule => rule(cart))` のように合成
- 各ルールが独立した純粋関数
- ルール追加が容易
- 適用順序が明示されている
- 割引結果が構造化されている
- price breakdown を返せる

例:

```ts
const discountRules: readonly DiscountRule[] = [
  firstPurchaseDiscount,
  couponDiscount,
  saleItemDiscount,
];
```

---

### 7: nullable を安全に扱う

#### 減点対象

```ts
if (!response.user) return undefined;
if (!response.user.profile) return undefined;
if (!response.user.profile.address) return undefined;
return response.user.profile.address.postalCode;
```

```ts
return response.user!.profile!.address!.postalCode!;
```

#### 加点対象

- optional chaining
- 欠損理由を型で表す
- `undefined` と invalid value を区別している
- 呼び出し側で安全に処理できる API になっている

---

### 8: Deep Immutable Update

#### 評価ポイント

- immutable update
- 再帰と `map` の使い方
- 参照共有
- エラー処理
- `structuredClone` してから破壊的に変更する実装を避けているか

---

### 9: Deterministic Domain Logic

#### 評価ポイント

- 依存性注入
- 純粋性
- テスト容易性
- 副作用境界の分離

---

## EVALUATION.md について

親エージェントは、提出された評価プロジェクトを確認し、以下の形式で評価する。

````md
# Review

## 総合点

xx / 100

## ゲート条件

- lint: pass / fail
- typecheck: pass / fail
- test: pass / fail
- テスト改変なし: pass / fail
- public API 互換: pass / fail

## 観点別スコア

| 観点                               | 点数 | コメント |
| ---------------------------------- | ---: | -------- |
| 純粋性・副作用分離                 |  /15 |          |
| 不変性・状態管理                   |  /12 |          |
| データ変換の宣言性                 |  /12 |          |
| エラー処理                         |  /14 |          |
| 型設計                             |  /14 |          |
| 非同期・ストリーム・リソース管理   |  /10 |          |
| 可読性・実用性                     |  /10 |          |
| lint / typecheck / test discipline |   /8 |          |
| 自己評価・フィードバック品質       |   /5 |          |

## 良い点

- ...

## 問題点

- ...

## 命令的・非宣言的な箇所

### 箇所 1

```ts
// 該当コード
```
````

理由:

改善案:

## 型安全性の問題

- ...

## エラー処理の問題

- ...

## 副作用分離の問題

- ...

## AGENTS.md / SKILLS.md 改善提案

- ...

## 次回のコーディングエージェントへの追加指示

- ...

```

```
