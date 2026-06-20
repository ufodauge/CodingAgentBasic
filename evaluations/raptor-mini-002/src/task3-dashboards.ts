import type { Result } from "./result.js";
import { err, ok } from "./result.js";
import { isFiniteNumber, isRecord, isString } from "./guards.js";

export type DashboardUser = {
  readonly id: string;
  readonly name: string;
};

export type Order = {
  readonly id: string;
  readonly total: number;
};

export type Recommendation = {
  readonly id: string;
  readonly title: string;
};

export type UserDashboard = {
  readonly user: DashboardUser;
  readonly orders: readonly Order[];
  readonly recommendations: readonly Recommendation[];
};

export type LoadError = {
  readonly userId: string;
  readonly resource: "user" | "orders" | "recommendations";
  readonly type: "network" | "http" | "parse" | "validation" | "abort";
  readonly message: string;
};

const baseUrl = "https://example.com";

const validateUser = (payload: unknown): Result<DashboardUser, string> => {
  if (!isRecord(payload)) {
    return err("user payload must be an object");
  }

  if (!isString(payload.id) || !isString(payload.name)) {
    return err("user payload must include id and name");
  }

  return ok({ id: payload.id, name: payload.name });
};

const validateOrders = (payload: unknown): Result<readonly Order[], string> => {
  if (!Array.isArray(payload)) {
    return err("orders payload must be an array");
  }

  const orders: Order[] = [];
  for (const item of payload) {
    if (!isRecord(item) || !isString(item.id) || !isFiniteNumber(item.total)) {
      return err("orders payload must contain valid id and total");
    }
    orders.push({ id: item.id, total: item.total });
  }

  return ok(orders);
};

const validateRecommendations = (payload: unknown): Result<readonly Recommendation[], string> => {
  if (!Array.isArray(payload)) {
    return err("recommendations payload must be an array");
  }

  const recommendations: Recommendation[] = [];
  for (const item of payload) {
    if (!isRecord(item) || !isString(item.id) || !isString(item.title)) {
      return err("recommendations payload must contain valid id and title");
    }
    recommendations.push({ id: item.id, title: item.title });
  }

  return ok(recommendations);
};

const fetchResource = async <T>(
  userId: string,
  resource: LoadError["resource"],
  validate: (payload: unknown) => Result<T, string>,
  signal: AbortSignal,
): Promise<Result<T, LoadError>> => {
  const url = `${baseUrl}/users/${encodeURIComponent(userId)}${
    resource === "user" ? "" : `/${resource}`
  }`;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return err({
        userId,
        resource,
        type: "http",
        message: `HTTP ${String(response.status)}`,
      });
    }

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      return err({
        userId,
        resource,
        type: "parse",
        message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const validation = validate(parsed);
    if (!validation.ok) {
      return err({
        userId,
        resource,
        type: "validation",
        message: validation.error,
      });
    }

    return ok(validation.value);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return err({
        userId,
        resource,
        type: "abort",
        message: error.message,
      });
    }

    return err({
      userId,
      resource,
      type: "network",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const loadDashboards = async (
  userIds: readonly string[],
  signal: AbortSignal,
): Promise<Result<readonly UserDashboard[], readonly LoadError[]>> => {
  const userPromises = userIds.map(async (userId) => {
    const [userResult, ordersResult, recommendationsResult] = await Promise.all([
      fetchResource(userId, "user", validateUser, signal),
      fetchResource(userId, "orders", validateOrders, signal),
      fetchResource(userId, "recommendations", validateRecommendations, signal),
    ]);

    const errors = [userResult, ordersResult, recommendationsResult].flatMap((result) =>
      result.ok ? [] : [result.error],
    );

    return {
      userId,
      user: userResult.ok ? userResult.value : undefined,
      orders: ordersResult.ok ? ordersResult.value : undefined,
      recommendations: recommendationsResult.ok ? recommendationsResult.value : undefined,
      errors,
    } as const;
  });

  const results = await Promise.all(userPromises);
  const dashboards: UserDashboard[] = [];
  const errors: LoadError[] = [];

  for (const result of results) {
    if (result.errors.length > 0) {
      errors.push(...result.errors);
      continue;
    }

    const user = result.user;
    const orders = result.orders;
    const recommendations = result.recommendations;

    if (user && orders && recommendations) {
      dashboards.push({ user, orders, recommendations });
    }
  }

  return errors.length > 0 ? err(errors) : ok(dashboards);
};
