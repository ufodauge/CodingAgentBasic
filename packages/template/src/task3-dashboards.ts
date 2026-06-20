import type { Result } from "./result.js";

export type DashboardUser = unknown;
export type Order = unknown;
export type Recommendation = unknown;
export type UserDashboard = unknown;
export type LoadError = unknown;

export const loadDashboards = (
  _userIds: readonly string[],
  _signal: AbortSignal,
): Promise<Result<readonly UserDashboard[], readonly LoadError[]>> => {
  throw new Error("Not Implemented");
};
