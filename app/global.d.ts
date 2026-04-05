export {};

declare global {
  interface Window {
    selldrawer_config?: {
      currency?: {
        code?: string;
        symbol?: string;
        isoCode?: string;
      };
      shop?: string;
      locale?: string;
      themeConfig?: any;
    };
  }
}
