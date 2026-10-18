// Bun's bundler turns an imported asset into its URL and bundles imported CSS.
// These declarations tell the type checker about those imports.

declare module '*.css' {}

declare module '*.png' {
  const url: string;
  export default url;
}

declare module '*.svg' {
  const url: string;
  export default url;
}
