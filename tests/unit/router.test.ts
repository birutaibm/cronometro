jest.mock('vue-router', () => ({
  createRouter: jest.fn(() => ({ name: 'mock-router' })),
  createWebHistory: jest.fn(),
  createWebHashHistory: jest.fn(),
}));

describe('src/router/index.ts', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('router is created with correct routes', () => {
    const { router } = require('../../src/renderer/router');
    expect(router).toBeDefined();
    const { createRouter, createWebHashHistory } = require('vue-router');
    expect(createRouter).toHaveBeenCalled();
    const callArgs = (createRouter as jest.Mock).mock.calls[0][0];
    expect(callArgs.routes).toBeDefined();
    expect(callArgs.routes.length).toBe(3);
    expect(callArgs.routes[0].path).toBe('/');
    expect(callArgs.routes[0].name).toBe('timer-configurations-list');
    expect(callArgs.routes[0].component).toBeDefined();
    expect(callArgs.routes[1].path).toBe('/new_timer_configuration');
    expect(callArgs.routes[1].name).toBe('new-timer-configuration');
    expect(callArgs.routes[1].component).toBeDefined();
    expect(callArgs.routes[2].path).toBe('/timer');
    expect(callArgs.routes[2].name).toBe('timer');
    expect(callArgs.routes[2].component).toBeDefined();
    expect(createWebHashHistory).toHaveBeenCalled();
  });
});
