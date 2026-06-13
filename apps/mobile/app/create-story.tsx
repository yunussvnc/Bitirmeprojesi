import React from "react";
import CreateStoryScreen from "@/src/components/domain/contentCreation/CreateStoryScreen";
import { ErrorBoundary } from "@/src/components/ui/ErrorBoundary";

export default function CreateStoryRoute() {
  return (
    <ErrorBoundary>
      <CreateStoryScreen />
    </ErrorBoundary>
  );
}

