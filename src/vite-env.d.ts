/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  readonly VITE_SHARE_OBFUSCATION_KEY?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_IS_ELECTRON?: string;
  readonly VITE_WEB_APP_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface DocFlowDesktop {
  platform: string;
  isElectron: boolean;
}

interface Window {
  docFlowDesktop?: DocFlowDesktop;
}
