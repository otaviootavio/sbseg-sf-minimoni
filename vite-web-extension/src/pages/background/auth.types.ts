export interface WebsiteAuth {
  basicAccessDuration: number;
  secretAccessDuration: number;
  basicAuth: boolean;
  secretAuth: boolean;
  id: string;
  startTime: number;
  url: string;
}
