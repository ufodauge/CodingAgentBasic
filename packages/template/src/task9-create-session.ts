export type Session = unknown;

export type SessionDependencies = {
  readonly now: () => Date;
  readonly randomId: () => string;
};

export const createSession = (_userId: string, _deps: SessionDependencies): Session => {
  throw new Error("Not Implemented");
};
