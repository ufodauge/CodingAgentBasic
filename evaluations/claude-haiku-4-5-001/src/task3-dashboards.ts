import type { Result } from "./result.js";
import { err, ok } from "./result.js";
import { isRecord, isString, isFiniteNumber } from "./guards.js";

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

export type LoadError =
  | { readonly type: "network"; readonly userId: string; readonly message: string }
  | { readonly type: "http"; readonly userId: string; readonly resource: string; readonly status: number }
  | { readonly type: "validation"; readonly userId: string; readonly resource: string; readonly message: string }
  | { readonly type: "abort"; readonly userId: string; readonly message: string };

const isDashboardUser = (input: unknown): input is DashboardUser =>
  isRecord(input) && isString(input.id) && isString(input.name);

const isOrder = (input: unknown): input is Order =>
  isRecord(input) && isString(input.id) && isFiniteNumber(input.total);

const isOrderArray = (input: unknown): input is readonly Order[] =>
  Array.isArray(input) && input.every(isOrder);

const isRecommendation = (input: unknown): input is Recommendation =>
  isRecord(input) && isString(input.id) && isString(input.title);

const isRecommendationArray = (input: unknown): input is readonly Recommendation[] =>
  Array.isArray(input) && input.every(isRecommendation);

const fetchWithValidation = async <T,>(
  url: string,
  userId: string,
  resource: string,
  signal: AbortSignal,
  validator: (input: unknown) => input is T,
): Promise<Result<T, LoadError>> => {
  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return err({
        type: "http",
        userId,
        resource,
        status: response.status,
      });
    }

    const data = await response.json() as unknown;

    if (!validator(data)) {
      return err({
        type: "validation",
        userId,
        resource,
        message: "Response validation failed",
      });
    }

    return ok(data);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return err({
        type: "abort",
        userId,
        message: "Request aborted",
      });
    }

    return err({
      type: "network",
      userId,
      message: String(e),
    });
  }
};

export const loadDashboards = async (
  userIds: readonly string[],
  signal: AbortSignal,
): Promise<Result<readonly UserDashboard[], readonly LoadError[]>> => {
  const dashboards: UserDashboard[] = [];
  const errors: LoadError[] = [];

  const promises = userIds.map((userId) => {
    const userPromise = fetchWithValidation(
      `/users/${userId}`,
      userId,
      "user",
      signal,
      isDashboardUser,
    );

    const ordersPromise = fetchWithValidation(
      `/users/${userId}/orders`,
      userId,
      "orders",
      signal,
      isOrderArray,
    );

    const recommendationsPromise = fetchWithValidation(
      `/users/${userId}/recommendations`,
      userId,
      "recommendations",
      signal,
      isRecommendationArray,
    );

    return Promise.all([userPromise, ordersPromise, recommendationsPromise]).then(
      ([userResult, ordersResult, recommendationsResult]) => {
        if (!userResult.ok) {
          errors.push(userResult.error);
        }

        if (!ordersResult.ok) {
          errors.push(ordersResult.error);
        }

        if (!recommendationsResult.ok) {
          errors.push(recommendationsResult.error);
        }

        if (userResult.ok && ordersResult.ok && recommendationsResult.ok) {
          dashboards.push({
            user: userResult.value,
            orders: ordersResult.value,
            recommendations: recommendationsResult.value,
          });
        }
      },
    );
  });

  await Promise.all(promises);

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(dashboards);
};
