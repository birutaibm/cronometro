/// <reference types="vite/client" />

declare module '*.vue' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
