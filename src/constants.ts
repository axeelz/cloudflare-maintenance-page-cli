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

export const CLI_NAME = "cloudflare-maintenance-page-cli";
export const SECRETS_NAME = "cloudflare-token";
