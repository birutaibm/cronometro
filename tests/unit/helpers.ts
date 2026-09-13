export const createdWindows: any[] = [];
export const windowHandlers: Record<string, Function[]> = {};
export const ipcHandleHandlers: Record<string, Function | null> = {};
export const ipcOnHandlers: Record<string, Function[]> = {};
export const mockWebContents = { send: jest.fn(), executeJavaScript: jest.fn() };
