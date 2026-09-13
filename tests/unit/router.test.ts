jest.mock('vue-router', () => ({
  createRouter: jest.fn(() => ({ name: 'mock-router' })),
  createWebHistory: jest.fn(),
}));

describe('src/router/index.ts', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('router is created with correct routes', () => {
    const { router } = require('../../src/router');
    expect(router).toBeDefined();
    const { createRouter, createWebHistory } = require('vue-router');
    expect(createRouter).toHaveBeenCalled();
    const callArgs = (createRouter as jest.Mock).mock.calls[0][0];
    expect(callArgs.routes).toBeDefined();
    expect(callArgs.routes.length).toBe(2);
    expect(callArgs.routes[0].path).toBe('/');
    expect(callArgs.routes[0].name).toBe('time-input');
    expect(callArgs.routes[0].component).toBeDefined();
    expect(callArgs.routes[1].path).toBe('/timer/:seconds?');
    expect(callArgs.routes[1].name).toBe('timer');
    expect(callArgs.routes[1].component).toBeDefined();
    expect(createWebHistory).toHaveBeenCalled();
  });
});
