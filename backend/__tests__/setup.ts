global.console.error = jest.fn();
global.console.warn = jest.fn();
global.console.log = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.clearAllMocks();
});
