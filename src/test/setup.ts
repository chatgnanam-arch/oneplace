import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { webcrypto } from "node:crypto";
import { afterEach } from "vitest";

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: webcrypto
  });
}

if (!globalThis.btoa) {
  globalThis.btoa = (value: string) => Buffer.from(value, "binary").toString("base64");
}

if (!globalThis.atob) {
  globalThis.atob = (value: string) => Buffer.from(value, "base64").toString("binary");
}

afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
  cleanup();
});
