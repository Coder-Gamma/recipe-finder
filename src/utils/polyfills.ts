// TensorFlow.js polyfills for browser environment

// Browser polyfills for Node.js globals that TensorFlow.js might expect
if (typeof window !== "undefined") {
  // Polyfill for module system using globalThis
  const globalWindow = globalThis as unknown as Record<string, unknown>;

  if (typeof globalWindow.module === "undefined") {
    globalWindow.module = {};
  }

  if (typeof globalWindow.exports === "undefined") {
    globalWindow.exports = {};
  }

  if (typeof globalWindow.require === "undefined") {
    globalWindow.require = () => ({});
  }

  // Make sure global variables are available
  globalWindow.global = globalThis;
  globalWindow.process = {
    env: { NODE_ENV: "development" },
    browser: true,
    version: "v18.0.0",
  };

  // Long.js polyfill for TensorFlow.js (simple approach)
  globalWindow.Long = {
    fromString: (str: string, unsigned?: boolean, radix?: number) => {
      const parsed = parseInt(str, radix || 10);
      return {
        low: parsed & 0xffffffff,
        high: (parsed / 0x100000000) | 0,
        unsigned: !!unsigned,
        toNumber: () => parsed,
        toString: () => str,
      };
    },
    fromNumber: (num: number, unsigned?: boolean) => ({
      low: num & 0xffffffff,
      high: (num / 0x100000000) | 0,
      unsigned: !!unsigned,
      toNumber: () => num,
      toString: () => num.toString(),
    }),
    fromValue: (val: unknown) => val,
    UZERO: { low: 0, high: 0, unsigned: true },
    ZERO: { low: 0, high: 0, unsigned: false },
  };
}

export {};
