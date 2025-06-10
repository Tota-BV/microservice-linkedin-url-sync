import { Chat } from "@/components/ai-chat-image-generation";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/chat/")({
  component: Chat,
});
