/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REPLICATE_PROXY_URL?: string;
  readonly VITE_HUGGINGFACE_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
