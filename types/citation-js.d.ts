// Type declarations untuk citation-js (tidak ada @types resmi)
declare module "@citation-js/core" {
  export class Cite {
    constructor(data: unknown);
    format(name: string, options?: Record<string, unknown>): string;
  }
  const _default: { plugins: { add: (plugin: unknown) => void } };
  export default _default;
}

declare module "@citation-js/plugin-csl" {
  const plugin: unknown;
  export default plugin;
}
