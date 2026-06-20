import { isFiniteNumber, isRecord, isString } from "./guards.js";
import { err, ok, sequence, type Result } from "./result.js";

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
export type LoadResource = "user" | "orders" | "recommendations";
export type LoadError = {
  readonly type: "network" | "abort" | "http" | "parse" | "validation";
  readonly userId: string;
  readonly resource: LoadResource;
  readonly message: string;
  readonly status?: number;
};

const resourcePaths = {
  user: (userId: string): string => `/users/${userId}`,
  orders: (userId: string): string => `/users/${userId}/orders`,
  recommendations: (userId: string): string => `/users/${userId}/recommendations`,
} satisfies Record<LoadResource, (userId: string) => string>;

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException ? error.name === "AbortError" : error instanceof Error && error.name === "AbortError";

const validationError = (userId: string, resource: LoadResource, message: string): LoadError => ({
  type: "validation",
  userId,
  resource,
  message,
});

const validateUser = (userId: string, input: unknown): Result<DashboardUser, LoadError> =>
  isRecord(input) && isString(input.id) && isString(input.name)
    ? ok({ id: input.id, name: input.name })
    : err(validationError(userId, "user", "user response must contain string id and name"));

const validateOrder = (userId: string, input: unknown): Result<Order, LoadError> =>
  isRecord(input) && isString(input.id) && isFiniteNumber(input.total)
    ? ok({ id: input.id, total: input.total })
    : err(validationError(userId, "orders", "order must contain string id and finite total"));

const validateRecommendation = (userId: string, input: unknown): Result<Recommendation, LoadError> =>
  isRecord(input) && isString(input.id) && isString(input.title)
    ? ok({ id: input.id, title: input.title })
    : err(
        validationError(
          userId,
          "recommendations",
          "recommendation must contain string id and title",
        ),
      );

const validateArray = <T>(
  userId: string,
  resource: Extract<LoadResource, "orders" | "recommendations">,
  input: unknown,
  validateItem: (userId: string, item: unknown) => Result<T, LoadError>,
): Result<readonly T[], readonly LoadError[]> =>
  Array.isArray(input)
    ? sequence(input.map((item) => validateItem(userId, item)))
    : err([validationError(userId, resource, `${resource} response must be an array`)]);

const parseJson = async (
  userId: string,
  resource: LoadResource,
  response: Response,
): Promise<Result<unknown, LoadError>> => {
  try {
    return ok(await response.json() as unknown);
  } catch (error) {
    return err({ type: "parse", userId, resource, message: toErrorMessage(error) });
  }
};

const fetchJson = async (
  userId: string,
  resource: LoadResource,
  signal: AbortSignal,
): Promise<Result<unknown, LoadError>> => {
  try {
    const response = await fetch(resourcePaths[resource](userId), { signal });

    if (!response.ok) {
      return err({
        type: "http",
        userId,
        resource,
        status: response.status,
        message: `HTTP ${String(response.status)}`,
      });
    }

    return await parseJson(userId, resource, response);
  } catch (error) {
    return err({
      type: isAbortError(error) ? "abort" : "network",
      userId,
      resource,
      message: toErrorMessage(error),
    });
  }
};

const loadDashboard = async (
  userId: string,
  signal: AbortSignal,
): Promise<Result<UserDashboard, readonly LoadError[]>> => {
  const [userJson, ordersJson, recommendationsJson] = await Promise.all([
    fetchJson(userId, "user", signal),
    fetchJson(userId, "orders", signal),
    fetchJson(userId, "recommendations", signal),
  ]);

  const fetchErrors: readonly LoadError[] = [
    ...(userJson.ok ? [] : [userJson.error]),
    ...(ordersJson.ok ? [] : [ordersJson.error]),
    ...(recommendationsJson.ok ? [] : [recommendationsJson.error]),
  ];

  const user = userJson.ok ? validateUser(userId, userJson.value) : undefined;
  const orders = ordersJson.ok
    ? validateArray(userId, "orders", ordersJson.value, validateOrder)
    : undefined;
  const recommendations = recommendationsJson.ok
    ? validateArray(userId, "recommendations", recommendationsJson.value, validateRecommendation)
    : undefined;
  const validationErrors: readonly LoadError[] = [
    ...(user === undefined || user.ok ? [] : [user.error]),
    ...(orders === undefined || orders.ok ? [] : orders.error),
    ...(recommendations === undefined || recommendations.ok ? [] : recommendations.error),
  ];
  const errors = [...fetchErrors, ...validationErrors];

  return user?.ok === true && orders?.ok === true && recommendations?.ok === true
    ? ok({ user: user.value, orders: orders.value, recommendations: recommendations.value })
    : err(errors);
};

export const loadDashboards = async (
  userIds: readonly string[],
  signal: AbortSignal,
): Promise<Result<readonly UserDashboard[], readonly LoadError[]>> => {
  const results = await Promise.all(userIds.map((userId) => loadDashboard(userId, signal)));
  const errors = results.flatMap((result) => (result.ok ? [] : result.error));

  return errors.length > 0 ? err(errors) : ok(results.flatMap((result) => (result.ok ? [result.value] : [])));
};
