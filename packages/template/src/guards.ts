export const isRecord = (input: unknown): input is Readonly<Record<string, unknown>> =>
  typeof input === "object" && input !== null && !Array.isArray(input);

export const isString = (input: unknown): input is string => typeof input === "string";

export const isFiniteNumber = (input: unknown): input is number =>
  typeof input === "number" && Number.isFinite(input);
