export interface SessionUser {
  id?: number;
  sub?: string;
  role: string;
  email?: string;
  username?: string | null;
}
