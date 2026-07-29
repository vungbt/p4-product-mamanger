/// <reference types="vite/client" />

declare module '*.scss' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.scss?inline' {
  const css: string;
  export default css;
}
