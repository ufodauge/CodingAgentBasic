import type { Result } from "./result.js";
import { isFiniteNumber, isRecord, isString } from "./guards.js";
import { err, ok } from "./result.js";

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
  readonly type: "network" | "abort" | "http" | "parse" | "validation";
  readonly message: string;
  readonly status?: number;
};

const toLoadError = (
  userId: string,
  resource: LoadError["resource"],
  type: LoadError["type"],
  message: string,
  status?: number,
): LoadError => ({
  userId,
  resource,
  type,
  message,
  ...(status === undefined ? {} : { status }),
});

const parseDashboardUser = (userId: string, input: unknown): Result<DashboardUser, LoadError> => {
  if (!isRecord(input) || !isString(input.id) || !isString(input.name)) {
    return err(toLoadError(userId, "user", "validation", "user response is invalid"));
  }

  return ok({ id: input.id, name: input.name });
};

const parseOrders = (userId: string, input: unknown): Result<readonly Order[], LoadError> => {
  if (!Array.isArray(input)) {
    return err(toLoadError(userId, "orders", "validation", "orders response must be an array"));
  }

  if (
    input.some(
      (order) => !isRecord(order) || !isString(order.id) || !isFiniteNumber(order.total),
    )
  ) {
    return err(toLoadError(userId, "orders", "validation", "orders response is invalid"));
  }

  return ok(
    input.flatMap((order) =>
      isRecord(order) && isString(order.id) && isFiniteNumber(order.total)
        ? [{ id: order.id, total: order.total }]
        : [],
    ),
  );
};

const parseRecommendations = (
  userId: string,
  input: unknown,
): Result<readonly Recommendation[], LoadError> => {
  if (!Array.isArray(input)) {
    return err(
      toLoadError(
        userId,
        "recommendations",
        "validation",
        "recommendations response must be an array",
      ),
    );
  }

  if (
    input.some(
      (recommendation) =>
        !isRecord(recommendation) || !isString(recommendation.id) || !isString(recommendation.title),
    )
  ) {
    return err(
      toLoadError(userId, "recommendations", "validation", "recommendations response is invalid"),
    );
  }

  return ok(
    input.flatMap((recommendation) =>
      isRecord(recommendation) && isString(recommendation.id) && isString(recommendation.title)
        ? [{ id: recommendation.id, title: recommendation.title }]
        : [],
    ),
  );
};

const fetchJson = async (
  userId: string,
  resource: LoadError["resource"],
  url: string,
  signal: AbortSignal,
): Promise<Result<unknown, LoadError>> => {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (caught: unknown) {
    const isAbort =
      signal.aborted || (caught instanceof DOMException && caught.name === "AbortError");
    const message = caught instanceof Error ? caught.message : String(caught);

    return err(toLoadError(userId, resource, isAbort ? "abort" : "network", message));
  }

  if (!response.ok) {
    return err(
      toLoadError(
        userId,
        resource,
        "http",
        "request failed with status " + String(response.status),
        response.status,
      ),
    );
  }

  try {
    const bodyText = await response.text();
    return ok(JSON.parse(bodyText) as unknown);
  } catch (caught: unknown) {
    const message = caught instanceof Error ? caught.message : String(caught);
    return err(toLoadError(userId, resource, "parse", message));
  }
};

const loadOneDashboard = async (
  userId: string,
  signal: AbortSignal,
): Promise<Result<UserDashboard, readonly LoadError[]>> => {
  const userRequest = fetchJson(userId, "user", `/users/${userId}`, signal);
  const ordersRequest = fetchJson(userId, "orders", `/users/${userId}/orders`, signal);
  const recommendationsRequest = fetchJson(
    userId,
    "recommendations",
    `/users/${userId}/recommendations`,
    signal,
  );

  const [userResult, ordersResult, recommendationsResult] = await Promise.all([
    userRequest,
    ordersRequest,
    recommendationsRequest,
  ]);

  const userValidation = userResult.ok ? parseDashboardUser(userId, userResult.value) : userResult;
  const ordersValidation = ordersResult.ok ? parseOrders(userId, ordersResult.value) : ordersResult;
  const recommendationsValidation = recommendationsResult.ok
    ? parseRecommendations(userId, recommendationsResult.value)
    : recommendationsResult;

  const errors = [userValidation, ordersValidation, recommendationsValidation].flatMap((result) =>
    result.ok ? [] : [result.error],
  );
  if (errors.length > 0) {
    return err(errors);
  }

  if (!userValidation.ok || !ordersValidation.ok || !recommendationsValidation.ok) {
    return err(errors);
  }

  return ok({
    user: userValidation.value,
    orders: ordersValidation.value,
    recommendations: recommendationsValidation.value,
  });
};

export const loadDashboards = (
  userIds: readonly string[],
  signal: AbortSignal,
): Promise<Result<readonly UserDashboard[], readonly LoadError[]>> => {
  return Promise.all(userIds.map((userId) => loadOneDashboard(userId, signal))).then((results) => {
    const dashboards = results.flatMap((result) => (result.ok ? [result.value] : []));
    const errors = results.flatMap((result) => (result.ok ? [] : result.error));

    return errors.length > 0 ? err(errors) : ok(dashboards);
  });
};
