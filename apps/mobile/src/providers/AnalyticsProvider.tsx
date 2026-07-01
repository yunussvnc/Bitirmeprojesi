import React from 'react';
import { PostHogProvider } from 'posthog-react-native';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    // If no API key is provided, just return children (Analytics disabled)
    return <>{children}</>;
  }

  return (
    <PostHogProvider 
      apiKey={apiKey} 
      options={{
        host: host,
      }}
    >
      {children}
    </PostHogProvider>
  );
}
