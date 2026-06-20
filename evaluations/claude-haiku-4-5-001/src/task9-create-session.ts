export type Session = {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: Date;
};

export type SessionDependencies = {
  readonly now: () => Date;
  readonly randomId: () => string;
};

export const createSession = (userId: string, deps: SessionDependencies): Session => {
  return {
    id: deps.randomId(),
    userId,
    createdAt: deps.now(),
  };
};
