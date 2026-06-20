# Coding Tests

このプロジェクトでは、以下の 9 課題を実装してください。
実装前に `AGENTS.md` と `SKILLS.md` を読み、純粋性、副作用分離、不変性、型安全性、宣言的なデータ変換を守ってください。

コピー直後の `src/task*.ts` は public API だけを持つ `Not Implemented` の雛形です。
`test/*.test.ts` は満たすべき受け入れテストです。テストを削除、弱体化、期待値変更してはいけません。

## 完了条件

作業完了前に以下をすべて成功させてください。

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

`EVALUATION.md` には、実装した課題、実行コマンド、結果、自己評価、改善点、`AGENTS.md` / `SKILLS.md` へのフィードバックを記録してください。

## 共通要件

- 入力オブジェクト、入力配列をミューテートしない。
- 予期される失敗は `throw` ではなく `Result`、`Option`、または discriminated union で返す。
- 型エラーを `as any`、根拠のない型アサーション、`eslint-disable` で隠さない。
- public API の関数名、引数、戻り値の意図を変えない。
- テスト通過のためだけのハードコードをしない。
- `unknown` は type guard や validator で段階的に絞る。
- 副作用は境界に寄せ、ドメインロジックを pure core として実装する。

---

## 1. バリデーションを Result で返す

対象: `src/task1-parse-user.ts`

外部 API から来た `unknown` な入力を検証し、`User` に変換する `parseUser` を実装してください。

```ts
type User = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly age: number;
};

type ValidationError =
  | { readonly field: "id"; readonly message: string }
  | { readonly field: "name"; readonly message: string }
  | { readonly field: "email"; readonly message: string }
  | { readonly field: "age"; readonly message: string };

function parseUser(input: unknown): Result<User, readonly ValidationError[]>;
```

要件:

- `throw` しない。
- 不正な項目が複数ある場合は全件返す。
- 入力オブジェクトをミューテートしない。
- field ごとの小さな validator を合成する。
- `unknown` から安全に型を絞る。
- `age` は有限な数値であること。
- `email` は最低限 `@` を含む文字列であること。
- `name` と `id` は trim 後に空文字でないこと。
- trim した値を返す場合でも入力を直接変更しない。

---

## 2. Web Stream API による JSON Lines 処理

対象: `src/task2-purchases.ts`

`ReadableStream<Uint8Array>` として渡される JSON Lines を処理し、purchase の合計を計算してください。

```ts
type RawEvent = {
  readonly userId: string;
  readonly type: "view" | "click" | "purchase";
  readonly amount?: number;
};

type PurchaseEvent = RawEvent & {
  readonly type: "purchase";
  readonly amount: number;
};
```

期待 API:

```ts
function createPurchaseAmountPipeline(): TransformStream<
  Uint8Array,
  Result<PurchaseEvent, InvalidLine>
>;

function summarizePurchases(
  input: ReadableStream<Uint8Array>,
): Promise<Result<PurchaseSummary, StreamError>>;
```

要件:

- `Uint8Array` decode、改行分割、JSON parse、validate、filter、summarize を分離する。
- `JSON.parse` の例外を外に漏らさない。
- 不正行は `InvalidLine` として値で扱う。
- 不正な JSON 行があっても処理全体をクラッシュさせない。
- 最終行が改行で終わらない場合も処理する。
- chunk 境界が行の途中に来る場合も正しく処理する。
- `purchase` 以外のイベントを除外する。
- `amount` が存在しない、または有限数値でない purchase は invalid として扱う。
- `pipeThrough` / `pipeTo` を優先し、back-pressure、cancel、abort、error propagation を考慮する。

---

## 3. 非同期 API 呼び出しを ResultAsync 的に合成する

対象: `src/task3-dashboards.ts`

ユーザー ID の配列を受け取り、各ユーザーについて `/users/:id`、`/users/:id/orders`、`/users/:id/recommendations` を取得して dashboard を返してください。

```ts
type UserDashboard = {
  readonly user: DashboardUser;
  readonly orders: readonly Order[];
  readonly recommendations: readonly Recommendation[];
};

function loadDashboards(
  userIds: readonly string[],
  signal: AbortSignal,
): Promise<Result<readonly UserDashboard[], readonly LoadError[]>>;
```

要件:

- 1 人のユーザーに必要な 3 API は並列に取得する。
- 複数ユーザーも可能な範囲で並列に取得する。
- 失敗は `LoadError` として返し、`throw` で表現しない。
- `AbortSignal` を fetch に伝播する。
- fetch 層、response validation、dashboard 組み立てを分離する。
- 複数ユーザー・複数 API の失敗を可能な範囲で集約する。
- network error、HTTP error、parse error、validation error を区別する。
- 必要なら concurrency limit を追加できる設計にする。

---

## 4. 状態機械を discriminated union で表現する

対象: `src/task4-order-state.ts`

注文状態の遷移を `transition` として実装してください。

```ts
type OrderState =
  | { readonly type: "draft" }
  | { readonly type: "submitted"; readonly submittedAt: Date }
  | { readonly type: "paid"; readonly paidAt: Date }
  | { readonly type: "shipped"; readonly shippedAt: Date; readonly trackingNumber: string }
  | { readonly type: "cancelled"; readonly reason: string };

type OrderEvent =
  | { readonly type: "submit"; readonly at: Date }
  | { readonly type: "pay"; readonly at: Date }
  | { readonly type: "ship"; readonly at: Date; readonly trackingNumber: string }
  | { readonly type: "cancel"; readonly reason: string };

function transition(state: OrderState, event: OrderEvent): Result<OrderState, InvalidTransition>;
```

要件:

- 不正な遷移は `InvalidTransition` として返す。
- 状態をミューテートしない。
- すべての状態・イベントの組み合わせを明示的に扱う。
- boolean flags で不正状態を作らない。
- `cancelled` から他状態へ戻れない。
- `shipped` 後は cancel できない。
- `draft -> submit -> paid -> shipped` の順序を守る。
- exhaustive check を入れる。

---

## 5. 副作用を持つ処理を計画と実行に分離する

対象: `src/task5-registration.ts`

ユーザー登録のビジネスロジックを、DB や mailer を直接呼ばない純粋な command plan として実装してください。

```ts
type RegisterInput = {
  readonly email: string;
  readonly name: string;
  readonly plan: "free" | "pro";
};

type Command =
  | { readonly type: "createUser"; readonly user: NewUser }
  | { readonly type: "sendWelcomeEmail"; readonly email: string }
  | { readonly type: "createBillingCustomer"; readonly email: string }
  | { readonly type: "writeAuditLog"; readonly message: string };

function planRegistration(
  input: RegisterInput,
): Result<readonly Command[], readonly RegistrationValidationError[]>;
```

要件:

- `planRegistration` は純粋関数にする。
- DB、mailer、billing、logger を直接呼ばない。
- validation error は `Result` で返す。
- `pro` plan の場合のみ billing customer 作成 command を含める。
- command の順序が意味を持つ場合は明示する。
- 入力値の正規化は入力を変更せず新しい値として扱う。

---

## 6. ルールエンジン的な割引計算

対象: `src/task6-price-cart.ts`

EC カートに対して割引ルールを適用し、price breakdown を返してください。

ルール:

- 初回購入なら 10% off。
- クーポンがあれば指定額 off。
- 合計金額が 10,000 円以上なら送料無料。
- VIP ならポイント 2 倍。
- セール対象商品は 20% off。

```ts
function priceCart(cart: Cart): PricedCart;
```

要件:

- 入力の cart、item、customer、coupon を変更しない。
- 各割引ルールは独立した純粋関数にする。
- ルールの適用順序を明示する。
- 金額が負にならないようにする。
- 小数処理や丸め規則を明示する。
- 送料無料、値引き、ポイント倍率など異なる効果を型で区別する。
- 重複適用の可否が分かる設計にする。
- ルール追加が容易な `readonly PricingRule[]` などの形にする。

---

## 7. Option / nullable を安全に扱う

対象: `src/task7-postal-code.ts`

ネストした API レスポンスから配送先郵便番号を取得してください。

```ts
type ApiResponse = {
  readonly user?: {
    readonly profile?: {
      readonly address?: {
        readonly postalCode?: string;
      };
    };
  };
};

function getPostalCode(response: ApiResponse): Option<string>;
```

要件:

- `Cannot read property of undefined` が起きない。
- `null` / `undefined` を明示的に扱う。
- 空文字の postal code をどう扱うか明示する。
- `Option`、`optionMap`、`optionFlatMap`、optional chaining などを活用する。
- `undefined` と invalid value を区別できる設計にするとさらによい。

---

## 8. Deep Immutable Update

対象: `src/task8-rename-node.ts`

ネストされたツリー構造を immutable に更新してください。

```ts
type TreeNode = {
  readonly id: string;
  readonly name: string;
  readonly children: readonly TreeNode[];
};

function renameNode(root: TreeNode, id: string, name: string): Result<TreeNode, RenameError>;
```

要件:

- 入力ツリーを破壊しない。
- 対象ノードだけ新しいオブジェクトにする。
- 変更がない部分は可能な範囲で参照を維持する。
- 見つからない場合は `Result` で返す。
- `structuredClone` してから破壊的に変更する実装を避ける。

---

## 9. Deterministic Domain Logic

対象: `src/task9-create-session.ts`

日時や乱数を直接読まず、依存性注入で決定的にテスト可能な session 作成を実装してください。

```ts
type Session = {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: Date;
};

function createSession(
  userId: string,
  deps: {
    readonly now: () => Date;
    readonly randomId: () => string;
  },
): Session;
```

要件:

- ドメインロジック内で `Date.now()` / `Math.random()` を直接呼ばない。
- `now` と `randomId` を引数で注入する。
- テストで固定値を渡せる。
- 戻り値は入力に対して決定的である。

---
