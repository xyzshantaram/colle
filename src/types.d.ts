import "@nhttp/nhttp";

declare module "@nhttp/nhttp" {
  interface State {
    user?: {
      username: string;
      // Extend here if you add more JWT fields
      [k: string]: unknown;
    };
  }
}
