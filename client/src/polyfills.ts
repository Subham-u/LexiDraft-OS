// Polyfill for simple-peer which expects 'global' to be defined
if (typeof window !== 'undefined' && !window.global) {
  (window as any).global = window;
}