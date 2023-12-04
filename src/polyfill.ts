// add property 'cachedKey' to global MediaStream type
export {};

declare global {
  interface MediaStream {
    cachedKey?: string;
  }
}
