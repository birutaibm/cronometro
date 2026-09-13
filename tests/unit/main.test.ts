const mockUse = jest.fn().mockReturnThis();
const mockComponent = jest.fn().mockReturnThis();
const mockMount = jest.fn();

jest.mock('vue', () => ({
  createApp: jest.fn(() => ({
    use: mockUse,
    component: mockComponent,
    mount: mockMount,
  })),
  createPinia: jest.fn(() => ({})),
  RouterLink: 'RouterLink',
  RouterView: 'RouterView',
}));

jest.mock('pinia', () => ({
  createPinia: jest.fn(() => ({})),
  setActivePinia: jest.fn(),
}));

jest.mock('vue-router', () => ({
  RouterLink: 'RouterLink',
  RouterView: 'RouterView',
}));

jest.mock('../../src/router', () => ({
  router: { name: 'mock-router' },
}));

describe('src/main.ts', () => {
  beforeEach(() => {
    (global as any).__router = undefined;
    (global as any).window = { __router: undefined };
    mockUse.mockClear();
    mockComponent.mockClear();
    mockMount.mockClear();
  });

  test('createApp is called with App component', () => {
    const vue = require('vue');
    const mockCreateApp = vue.createApp as jest.Mock;
    const mockApp = mockCreateApp();
    require('../../src/main');
    expect(mockCreateApp).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalledWith(expect.anything());
    expect(mockApp.use).toHaveBeenCalledWith(require('../../src/router').router);
    expect(mockApp.component).toHaveBeenCalledWith('RouterLink', 'RouterLink');
    expect(mockApp.component).toHaveBeenCalledWith('RouterView', 'RouterView');
    expect(mockApp.mount).toHaveBeenCalledWith('#app');
    expect((global as any).window.__router).toBe(require('../../src/router').router);
  });
});
