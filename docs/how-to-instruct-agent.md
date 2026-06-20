# TypeScript 宣言的コーディングエージェント評価プロジェクト仕様

## 目的

TypeScript を利用するプロジェクトにおいて、コーディングエージェントが以下の観点を守るような `AGENTS.md` / `SKILLS.md` を整備する。

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

そのうえで、実際にエージェントに `AGENTS.md` / `SKILLS.md` を利用させ、定性的な評価を行う。

評価は [エージェント向けコーディングテスト](#エージェント向けコーディングテスト) によって行う。

反省点はフィードバックとして `AGENTS.md` / `SKILLS.md` を修正するために利用する。

エージェントは `evaluations` ディレクトリにプロジェクトを pnpm のワークスペースとして作成し、そこで指定されたコーディングテストを実施する。

`packages/template` ディレクトリには、あらかじめ以下を含むコピー用プロジェクトを配置する。

- `Result` 型
- `Option` 型
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
    SKILLS.md
    EVALUATION.md
```

例:

```txt
evaluations/agent-run-001/
```

### 2. pnpm workspace への追加

ルートの `pnpm-workspace.yaml` に、評価用プロジェクトが workspace として認識されるようにする。

例:

```yaml
packages:
  - 'packages/*'
  - 'evaluations/*'
```

### 3. 必須コマンド

エージェントは作業完了前に以下を実行し、すべて成功させること。

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

プロジェクトに `check` コマンドがある場合は以下も実行する。

```bash
pnpm check
```

### 4. 提出物

評価用プロジェクトには最低限以下を含める。

```txt
AGENTS.md
SKILLS.md
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
- `AGENTS.md` / `SKILLS.md` に反映すべきフィードバック

---

## AGENTS.md に含めるべき内容

`AGENTS.md` は、プロジェクト全体に適用される行動規範として記述する。

最低限、以下を含めること。

### 基本方針

- TypeScript は strict mode を前提とする
- 実装は可能な限り純粋関数として記述する
- 副作用は境界に隔離する
- 入力値を破壊的に変更しない
- 予期される失敗は `throw` ではなく `Result` / `Option` / discriminated union で表現する
- 不正状態は型で表現不能にする
- 非同期処理は合成可能な形で扱う
- Stream 処理は `pipeThrough` / `pipeTo` などのパイプラインを優先する
- lint / typecheck / test を必ず通す

### 禁止事項

以下は禁止する。

- テストを意図的に弱める、削除する、期待値を改変する
- lint ルールを回避するためだけの `eslint-disable`
- 型エラーを隠すためだけの `as any`
- `any` の安易な使用
- `unknown as SomeType` のような根拠のない型アサーション
- 予期されるエラーを `throw` で表現する
- `catch` でエラーを握りつぶす
- 入力オブジェクトや入力配列のミューテーション
- グローバル状態への依存
- `Date.now()` / `Math.random()` / 環境変数などを純粋ロジックの中で直接読む
- DB / fetch / file system / console などの副作用をドメインロジックに混ぜる
- テスト通過のためだけのハードコード
- 不正状態を boolean flags の組み合わせで表現する

### 例外的に許容されるもの

以下は必要な理由が明確で、外部に副作用が漏れない場合のみ許容する。

- 関数内部に閉じた局所的な `let`
- パフォーマンス上必要な局所的ミューテーション
- `Map` / `Set` を用いた内部集計
- 境界層での `try-catch`
- 外部ライブラリの型不足を補う最小限の型アサーション

ただし、その場合も以下を満たすこと。

- 入力を破壊しない
- 外部から観測可能な副作用を発生させない
- 型安全性を著しく損なわない
- コメントで理由を説明する

---

## SKILLS.md に含めるべき内容

`SKILLS.md` は、エージェントが実装時に利用する具体的な技術指針として記述する。

最低限、以下の skill を含めること。

### 1. Result / Option を使ったエラー処理

- 予期される失敗は `Result<T, E>` で返す
- 値が存在しない可能性は `Option<T>` で表す
- `throw` は原則として想定外のプログラミングエラーまたは境界層に限定する
- 複数の validation error は配列や NonEmptyArray として蓄積する
- `map`, `flatMap`, `mapError`, `combine`, `sequence` などの合成関数を活用する

### 2. validator composition

- 大きな validator を一枚岩にしない
- field ごとの小さな validator を作る
- validation error は構造化する
- `unknown` から段階的に型を絞る
- 型アサーションに頼らず type guard を使う

### 3. immutable update

- 入力を直接変更しない
- 配列操作は `map`, `filter`, `flatMap`, `reduce`, `toSorted`, `toReversed`, `toSpliced` などを優先する
- オブジェクト更新は spread または明示的な constructor を利用する
- 深い更新では、変更が必要な部分だけ新しい参照を作る
- ただし、過剰な spread による性能劣化には注意する

### 4. declarative data transformation

- データ変換を処理手順ではなく変換パイプラインとして表現する
- 小さな純粋関数を合成する
- ルールや分岐を可能な範囲でデータ構造として表現する
- `reduce` は濫用しない
- `reduce` が読みにくい場合は、意味のある helper 関数を作る

### 5. state machine modeling

- 状態は discriminated union で表現する
- 不正状態を boolean flags で表現しない
- 状態遷移は reducer または transition table として実装する
- exhaustive check を入れる
- 不正遷移は `Result` で返す

### 6. async composition

- 独立した非同期処理は `Promise.all` などで合成する
- 逐次実行が必要な場合は理由を明確にする
- `AbortSignal` を受け取り、fetch などに伝播する
- エラーは構造化した `Result` として扱う
- `try-catch` は境界で最小限に留める

### 7. stream pipeline

- Web Stream API では `pipeThrough` / `pipeTo` を優先する
- `TransformStream` を小さな部品として定義する
- parse error は stream 全体のクラッシュではなく値として流す
- back-pressure を壊さない
- cancel / abort / error propagation を考慮する

### 8. pure core / imperative shell

- ビジネスロジックは pure core として実装する
- DB / API / mail / logging などは imperative shell に隔離する
- 副作用を直接実行せず、必要に応じて `Command` として記述する
- テストは pure core を中心に行う

### 9. lint / typecheck / test discipline

- lint error を残さない
- type error を残さない
- test failure を残さない
- 型エラーを `as any` で隠さない
- lint rule を無効化しない
- 既存テストを改変しない

---

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
- `AGENTS.md` / `SKILLS.md` を作成している
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
- nullable / optional な値を `Option` または明示的な型で扱っている: 2
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
- `AGENTS.md` / `SKILLS.md` への改善提案がある: 1
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

## エージェント向けコーディングテスト

テストは以下の各項目を実施させる。

---

# 1: バリデーションを Result で返す

外部 API から来た `unknown` な入力を検証し、`User` に変換する関数を実装してください。

```ts
type User = {
  id: string;
  name: string;
  email: string;
  age: number;
};

type ValidationError =
  | { field: 'id'; message: string }
  | { field: 'name'; message: string }
  | { field: 'email'; message: string }
  | { field: 'age'; message: string };

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

実装する関数:

```ts
function parseUser(input: unknown): Result<User, ValidationError[]>;
```

## 条件

- `throw` してはいけない
- 不正な項目が複数ある場合は、最初の1件だけでなく全件返す
- 入力オブジェクトをミューテートしてはいけない
- できるだけ小さな validator を合成して実装する
- `unknown` から安全に型を絞る
- `age` は有限な数値であること
- `email` は最低限 `@` を含む文字列であること
- `name` は trim 後に空文字でないこと
- trim した値を返す場合でも、入力オブジェクトを直接変更してはいけない

## 減点対象

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

## 加点対象

- `Result` を使う
- validator の合成がある
- エラー型が具体的
- validation error を蓄積している
- `unknown` から安全に型を絞っている
- `readonly` な入力を想定している
- field ごとの validator が独立している

---

# 2: Web Stream API による JSON Lines 処理

`ReadableStream<Uint8Array>` として渡される JSON Lines を処理してください。

各行は以下の JSON です。

```ts
type RawEvent = {
  userId: string;
  type: 'view' | 'click' | 'purchase';
  amount?: number;
};
```

これを以下の流れで処理するストリームパイプラインを作ってください。

1. `Uint8Array` を text に decode
2. 改行ごとに分割
3. JSON parse
4. 不正行は `InvalidLine` として扱う
5. `purchase` イベントだけ抽出
6. `amount` の合計を計算する

## 期待する関数例

```ts
function createPurchaseAmountPipeline(): TransformStream<
  Uint8Array,
  Result<PurchaseEvent, InvalidLine>
>;
```

または、

```ts
async function summarizePurchases(
  input: ReadableStream<Uint8Array>,
): Promise<Result<PurchaseSummary, StreamError>>;
```

## 条件

- `JSON.parse` の例外を外に漏らさない
- 不正な JSON 行があっても処理全体をクラッシュさせない
- 最終行が改行で終わらない場合も処理する
- chunk の境界が行の途中に来る場合も正しく処理する
- `purchase` 以外のイベントを適切に除外する
- `amount` が存在しない、または数値でない purchase は invalid として扱う
- stream の cancel / abort / error を考慮する
- back-pressure を壊さない

## 減点対象

- `while (true)` で reader を直接回す
- `let total = 0` を外側で更新し続ける
- `JSON.parse` の例外が外に漏れる
- 不正行で処理全体をクラッシュさせる
- stream の cancel / error を考慮しない
- chunk 境界を無視して `chunk.split('\n')` だけで処理する

## 加点対象

- `pipeThrough` / `pipeTo` によるパイプライン
- `TransformStream` の小さな部品化
- parse error を `Result` として流す
- データフローが読みやすい
- back-pressure を壊さない
- 改行分割 stream が chunk 境界を正しく扱う
- parse / validate / filter / summarize が分離されている

---

# 3: 非同期 API 呼び出しを ResultAsync 的に合成する

ユーザー ID の配列を受け取り、各ユーザーについて以下を取得してください。

- `/users/:id`
- `/users/:id/orders`
- `/users/:id/recommendations`

最終的に以下を返してください。

```ts
type UserDashboard = {
  user: User;
  orders: Order[];
  recommendations: Recommendation[];
};
```

関数:

```ts
function loadDashboards(
  userIds: readonly string[],
  signal: AbortSignal,
): Promise<Result<UserDashboard[], LoadError[]>>;
```

## 条件

- 1人のユーザーに必要な3つの API は並列に取得する
- 複数ユーザーも可能な範囲で並列に取得する
- 失敗は `throw` ではなく `LoadError` として返す
- `AbortSignal` に対応する
- 取得、変換、エラー処理を分離する
- 複数のユーザーで失敗が起きた場合、可能な範囲でエラーを集約する
- fetch 層と dashboard 組み立て層を分離する
- API レスポンスの validation を行う

## 減点対象

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

## 加点対象

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

# 4: 状態機械を discriminated union で表現する

注文の状態遷移を実装してください。

状態:

```ts
type OrderState =
  | { type: 'draft' }
  | { type: 'submitted'; submittedAt: Date }
  | { type: 'paid'; paidAt: Date }
  | { type: 'shipped'; shippedAt: Date; trackingNumber: string }
  | { type: 'cancelled'; reason: string };
```

イベント:

```ts
type OrderEvent =
  | { type: 'submit'; at: Date }
  | { type: 'pay'; at: Date }
  | { type: 'ship'; at: Date; trackingNumber: string }
  | { type: 'cancel'; reason: string };
```

実装:

```ts
function transition(
  state: OrderState,
  event: OrderEvent,
): Result<OrderState, InvalidTransition>;
```

## 条件

- 不正な遷移は `throw` せず `InvalidTransition` を返す
- 状態をミューテートしない
- すべての状態・イベントの組み合わせを明示的に扱う
- 不正状態を object の boolean flags で表現しない
- `cancelled` から他の状態へ戻れない
- `shipped` 後は cancel できないものとする
- `draft -> submit -> paid -> shipped` の順序を守る

## 減点対象

```ts
type Order = {
  isDraft: boolean;
  isPaid: boolean;
  isShipped: boolean;
  isCancelled: boolean;
};
```

```ts
state.type = 'paid';
```

```ts
return { ...state, type: event.type as any };
```

## 加点対象

- discriminated union
- exhaustive check
- 遷移表または reducer として実装
- 不正状態を型で排除
- `InvalidTransition` に現在状態とイベントが含まれている
- 時刻や tracking number などの event payload を正しく使用している

---

# 5: 副作用を持つ処理を「計画」と「実行」に分離する

ユーザー登録処理を実装してください。

入力:

```ts
type RegisterInput = {
  email: string;
  name: string;
  plan: 'free' | 'pro';
};
```

登録時には以下が必要です。

- 入力値を検証する
- DB に user を作成する
- welcome email を送る
- pro plan の場合は billing customer を作成する
- audit log を出す

ただし、ビジネスロジックは副作用を直接実行せず、まず以下のような `Command` の配列を返してください。

```ts
type Command =
  | { type: 'createUser'; user: NewUser }
  | { type: 'sendWelcomeEmail'; email: string }
  | { type: 'createBillingCustomer'; email: string }
  | { type: 'writeAuditLog'; message: string };
```

実装:

```ts
function planRegistration(
  input: RegisterInput,
): Result<Command[], ValidationError[]>;
```

## 条件

- `planRegistration` は純粋関数であること
- DB / mailer / billing / logger を直接呼ばないこと
- validation error は `Result` で返すこと
- `pro` plan の場合のみ billing customer 作成 command を含めること
- command の順序が意味を持つ場合は明示すること
- 入力値の正規化は入力オブジェクトを変更せず、新しい値として扱うこと

## 減点対象

```ts
await db.users.insert(...)
await mailer.send(...)
await billing.createCustomer(...)
```

をビジネスロジック内で直接呼ぶ。

```ts
input.email = input.email.toLowerCase();
```

## 加点対象

- 純粋関数で command を生成
- 副作用実行層とロジック層が分離
- テストしやすい
- エラーも値として返す
- `plan` による分岐がデータ構造として読みやすい
- command を実行する interpreter を別に定義できる設計
- command の型が網羅的に扱える

---

# 6: ルールエンジン的な割引計算

EC カートに対して割引を適用してください。

```ts
type Cart = {
  items: CartItem[];
  customer: Customer;
  coupon?: Coupon;
};
```

割引ルール:

- 初回購入なら 10% off
- クーポンがあれば指定額 off
- 合計金額が 10,000 円以上なら送料無料
- VIP ならポイント 2 倍
- セール対象商品は 20% off

実装:

```ts
function priceCart(cart: Cart): PricedCart;
```

## 条件

- 入力の cart / item / customer / coupon を変更しない
- 各割引ルールは独立した純粋関数にする
- ルールの適用順序を明示する
- 金額が負にならないようにする
- 小数処理や丸め規則を明示する
- 送料無料、値引き、ポイント倍率など異なる効果を型で区別する
- 重複適用の可否が分かる設計にする

## 減点対象

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

## 加点対象

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

# 7: Option / nullable を安全に扱う

ネストした API レスポンスからユーザーの配送先郵便番号を取得してください。

```ts
type ApiResponse = {
  user?: {
    profile?: {
      address?: {
        postalCode?: string;
      };
    };
  };
};
```

実装:

```ts
function getPostalCode(response: ApiResponse): Option<string>;
```

または:

```ts
function getPostalCode(response: ApiResponse): string | undefined;
```

## 条件

- `Cannot read property of undefined` が起きない
- `null` / `undefined` を明示的に扱う
- 値が存在しない理由を区別できるとさらによい
- 空文字の postal code をどう扱うか明示する
- postal code の format validation を行う場合はエラー型で表す

## 減点対象

```ts
if (!response.user) return undefined;
if (!response.user.profile) return undefined;
if (!response.user.profile.address) return undefined;
return response.user.profile.address.postalCode;
```

```ts
return response.user!.profile!.address!.postalCode!;
```

## 加点対象

- optional chaining
- Option 型
- `map`, `flatMap`, `getOrElse` のような合成
- 欠損理由を型で表す
- `undefined` と invalid value を区別している
- 呼び出し側で安全に処理できる API になっている

---

## 追加推奨課題

余力がある場合、以下も追加すると評価精度が上がる。

---

# 8: Deep Immutable Update

ネストされたツリー構造を immutable に更新する。

```ts
type Node = {
  id: string;
  name: string;
  children: readonly Node[];
};
```

実装:

```ts
function renameNode(
  root: Node,
  id: string,
  name: string,
): Result<Node, RenameError>;
```

## 条件

- 入力ツリーを破壊しない
- 対象ノードだけ新しいオブジェクトにする
- 変更がない部分は可能な範囲で参照を維持する
- 見つからない場合は `Result` で返す

## 評価ポイント

- immutable update
- 再帰と `map` の使い方
- 参照共有
- エラー処理
- `structuredClone` してから破壊的に変更する実装を避けているか

---

# 9: Deterministic Domain Logic

日時や乱数を使う処理を決定的にテスト可能にする。

```ts
function createSession(
  userId: string,
  deps: {
    now: () => Date;
    randomId: () => string;
  },
): Session;
```

## 条件

- ドメインロジック内で `Date.now()` / `Math.random()` を直接呼ばない
- 依存性を引数で注入する
- テストで固定値を渡せる
- 戻り値は入力に対して決定的である

## 評価ポイント

- 依存性注入
- 純粋性
- テスト容易性
- 副作用境界の分離

---

## Lint / TypeScript 設定要件

テンプレートプロジェクトでは、可能な限り以下を有効にする。

### TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "useUnknownInCatchVariables": true
  }
}
```

### ESLint 推奨ルール

以下の方針に合うルールを有効にする。

- `no-explicit-any`
- `no-floating-promises`
- `no-misused-promises`
- `consistent-type-imports`
- `prefer-readonly`
- `prefer-readonly-parameter-types` は厳しすぎる場合は任意
- `functional/no-let` は任意。採用する場合は例外規定を用意する
- `functional/immutable-data` は任意。採用する場合は過剰制約に注意する
- `no-console`
- `no-throw-literal`
- `no-restricted-syntax` で必要に応じて `forEach` や `while` を警告対象にする

ただし、lint は目的ではなく手段である。

lint を厳しくしすぎて可読性や実用性を損なわないよう注意する。

---

## テスト要件

各課題には通常ケースだけでなく、以下を含める。

### 共通

- 正常系
- 異常系
- 境界値
- 入力がミューテートされていないこと
- 複数エラーが蓄積されること
- public API の型が意図通りであること
- `throw` しないこと

### Stream

- chunk が行途中で分割されるケース
- 最終行に改行がないケース
- invalid JSON
- invalid event
- purchase 以外の event
- amount がない purchase
- abort / cancel

### Async

- 全 API 成功
- 一部 API 失敗
- 複数ユーザーで失敗
- abort
- HTTP error
- invalid JSON
- invalid response shape
- 並列実行されていること

### State machine

- valid transition
- invalid transition
- cancelled から復帰できない
- shipped 後に cancel できない
- exhaustive check が効いていること

### Rule engine

- ルール単体
- 複数ルールの合成
- 適用順序
- 割引上限
- 負の金額にならないこと
- 入力を破壊しないこと

---

## EVALUATION.md 出力形式

エージェントは作業完了時に `EVALUATION.md` を作成し、以下の形式で記載する。

```md
# Evaluation Report

## 実装対象

- [ ] 1: バリデーションを Result で返す
- [ ] 2: Web Stream API による JSON Lines 処理
- [ ] 3: 非同期 API 呼び出しを ResultAsync 的に合成する
- [ ] 4: 状態機械を discriminated union で表現する
- [ ] 5: 副作用を持つ処理を「計画」と「実行」に分離する
- [ ] 6: ルールエンジン的な割引計算
- [ ] 7: Option / nullable を安全に扱う

## 実行コマンド

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## 実行結果

- lint:
- typecheck:
- test:

## 設計方針

- Result / Option の使い方:
- 副作用分離:
- 不変性:
- 型設計:
- 非同期・Stream 処理:

## 宣言的に書けた点

- ...

## 妥協した点

- ...

## 改善余地

- ...

## AGENTS.md / SKILLS.md へのフィードバック

- ...
```

---

## 親エージェント用評価出力形式

親エージェントは、提出された評価プロジェクトを確認し、以下の形式で評価する。

```md
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

| 観点 | 点数 | コメント |
|---|---:|---|
| 純粋性・副作用分離 | /15 | |
| 不変性・状態管理 | /12 | |
| データ変換の宣言性 | /12 | |
| エラー処理 | /14 | |
| 型設計 | /14 | |
| 非同期・ストリーム・リソース管理 | /10 | |
| 可読性・実用性 | /10 | |
| lint / typecheck / test discipline | /8 | |
| 自己評価・フィードバック品質 | /5 | |

## 良い点

- ...

## 問題点

- ...

## 命令的・非宣言的な箇所

### 箇所 1

```ts
// 該当コード
```

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

---

## 最終的に目指す状態

この評価プロジェクトは、単に `map` / `filter` / `reduce` を使えるかを見るものではない。

目指すのは、TypeScript において以下を自然に選択できるエージェントを育てることである。

- 予期される失敗を値として扱う
- nullable を型で扱う
- 不正状態を型で排除する
- 副作用を境界に分離する
- データ変換をパイプラインとして表現する
- 非同期処理を合成可能に扱う
- Stream 処理で back-pressure や chunk 境界を壊さない
- 入力を破壊しない
- lint / typecheck / test を回避せず正面から通す
- 過剰な抽象化ではなく、実用的で読みやすい宣言的コードを書く

評価では、構文上の特徴だけでなく、コード全体の設計として宣言的・合成可能・型安全・テスト可能になっているかを重視する。