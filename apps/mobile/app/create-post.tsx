import React from "react";
import CreatePostScreen from "@/src/components/domain/contentCreation/CreatePostScreen";
import { ErrorBoundary } from "@/src/components/ui/ErrorBoundary";

export default function CreatePostRoute() {
  return (
    <ErrorBoundary>
      <CreatePostScreen />
    </ErrorBoundary>
  );
}

