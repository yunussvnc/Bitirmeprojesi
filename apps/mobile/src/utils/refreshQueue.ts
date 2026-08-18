interface RefreshSubscriber {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

let subscribers: RefreshSubscriber[] = [];

export function waitForTokenRefresh(): Promise<string> {
  return new Promise((resolve, reject) => {
    subscribers.push({ resolve, reject });
  });
}

export function resolveTokenRefresh(token: string): void {
  const pending = subscribers;
  subscribers = [];
  pending.forEach(({ resolve }) => resolve(token));
}

export function rejectTokenRefresh(error: Error): void {
  const pending = subscribers;
  subscribers = [];
  pending.forEach(({ reject }) => reject(error));
}

export function pendingTokenRefreshCount(): number {
  return subscribers.length;
}
