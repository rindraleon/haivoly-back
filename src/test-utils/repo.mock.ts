/**
 * Fabrique de repository TypeORM simulé (tests unitaires).
 */
export interface MockManager {
  transaction: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  findAndCount: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  delete: jest.Mock;
  update: jest.Mock;
}

export type MockRepo = Record<
  | 'findOne'
  | 'find'
  | 'findAndCount'
  | 'save'
  | 'create'
  | 'update'
  | 'delete'
  | 'remove',
  jest.Mock
> & { manager: MockManager };

export function createMockManager(
  overrides: Partial<MockManager> = {},
): MockManager {
  const manager = {
    transaction: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    save: jest.fn(
      async (_entity?: unknown, value?: unknown) => value ?? _entity,
    ),
    create: jest.fn((_entity?: unknown, value?: unknown) => value ?? _entity),
    delete: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };

  // Par défaut, transaction() exécute le callback avec ce manager simulé.
  if (!overrides.transaction) {
    manager.transaction.mockImplementation(
      async (callback: (m: MockManager) => Promise<unknown>) =>
        callback(manager),
    );
  }

  return manager;
}

export function createMockRepo(
  manager: MockManager = createMockManager(),
): MockRepo {
  return {
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    save: jest.fn((value: unknown) => value),
    create: jest.fn((value: unknown) => value),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    manager,
  };
}
