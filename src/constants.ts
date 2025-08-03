import { dirname } from "node:path";

export type ConfigJSON = {
  CLOUDFLARE: {
    ACCOUNT_ID: string;
    API_TOKEN: string;
    ZONE_ID: string;
    SCRIPT_NAME: string;
  };
  PAGE: {
    STATUS_CODE: number;
    TITLE: string;
    MESSAGE: string;
    EXPECTED_COMPLETION_ISO: string | null;
    RETRY_AFTER_SECONDS: number;
    CONTACT_EMAIL: string;
    STATUS_PAGE: string | null;
  };
};

export const PROJECT_ROOT = dirname(import.meta.dirname);
