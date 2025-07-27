export interface MaintenanceOptions {
  statusCode: number;
  title: string;
  message: string;
  expectedCompletionIso?: string;
  retryAfterSeconds: number;
  contactEmail: string;
  statusPage: string;
}
