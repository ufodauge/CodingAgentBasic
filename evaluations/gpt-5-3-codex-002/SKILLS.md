# SKILLS.md

このファイルは、この評価課題を実装するときの課題固有の技術メモです。
汎用的なコーディング原則は `AGENTS.md` に従ってください。

## 1. parseUser

- `id`、`name`、`email`、`age` は field ごとの validator に分ける。
- non-object input でも throw せず、各 field の validation error を返す。
- `id` と `name` は trim 後の空文字を invalid にする。
- `email` は trim 後に `@` を含むことを最低条件にする。
- `age` は `Number.isFinite` 相当で有限数値だけを受け入れる。

## 2. JSON Lines Stream

- decode、line split、JSON parse、RawEvent validation、purchase filter、summary を分離する。
- chunk 境界で行が分割されるため、未完了行の buffer を持つ。
- 最終行が改行で終わらない場合は `flush` で処理する。
- invalid JSON、invalid event、amount 欠損・非数値 purchase は `InvalidLine` として流す。
- cancel / abort は型だけでは確認できないため、既存の受け入れテストで伝播を確認する。必要に応じて一時スクリプトで検証してもよいが、作業後に削除する。

## 3. loadDashboards

- user ごとの user / orders / recommendations は同時に fetch する。
- 複数 user も `Promise.all(userIds.map(...))` で合成する。
- fetch、HTTP status、JSON parse、response validation、dashboard assembly を分ける。
- network、abort、http、parse、validation を区別できる `LoadError` にする。
- validation と結果集約で `for` / `push` に寄りすぎると lint warning と減点につながるため、typed guard と `map` / `flatMap` を優先する。

## 4. Order State Machine

- `OrderState` と `OrderEvent` は discriminated union として具体化する。
- `draft -> submitted -> paid -> shipped` の順序を守る。
- `cancelled` と `shipped` は terminal state として扱う。
- invalid transition には current state と event type を含める。

## 5. planRegistration

- `planRegistration` は DB / mailer / billing / logger を呼ばず、`Command[]` だけを返す。
- email と name を正規化した新しい `NewUser` を作る。
- `pro` のみ `createBillingCustomer` を含める。
- command order は `createUser`、必要なら billing、welcome email、audit log の順を基本にする。
- validation error と command plan の組み立ては、可能なら conditional array composition で表現する。

## 6. priceCart

- `pricingRules` を export する場合は、空の飾りにせず実際の計算フローで使う。
- sale、first purchase、coupon、shipping、points は独立した rule として表現する。
- effects の順序は explainable breakdown として安定させる。
- `discountTotal` は実際に適用された割引額として返し、`subtotal` を超えない。
- 送料無料は shipping effect として扱い、discount cap と混同しない。
- fractional yen は丸め規則を実装上明確にする。

## 7. getPostalCode

- optional chaining と `Option` helper を使い、missing / nullish / blank を安全に `none` にする。
- trim 後の値だけを `some` で返す。
- 外部 JSON 由来の `null` が混ざっても throw しない。

## 8. renameNode

- 見つからない場合は `Result` の error を返す。
- 対象 node とその祖先だけ新しい参照にする。
- 変更がない branch は可能な限り元参照を維持する。
- `structuredClone` 後の破壊的変更で済ませない。

## 9. createSession

- `Date.now()` / `Math.random()` は直接呼ばず、`deps.now` と `deps.randomId` を使う。
- 同じ deps を渡したときに同じ戻り値になるようにする。

## 提出前チェック

- `pnpm lint` の warning も 0 にする。
- `pnpm typecheck` と `pnpm test` を通す。
- 一時スクリプト、debug log、console 出力を残さない。
- `EVALUATION.md` に実行結果、妥協点、改善余地、AGENTS / SKILLS へのフィードバックを書く。