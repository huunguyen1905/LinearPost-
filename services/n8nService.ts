import { WebhookResponse } from "../types";

// Simulates sending data to an n8n webhook
export const triggerWebhook = async (payload: any): Promise<WebhookResponse> => {
  console.log("Triggering n8n webhook with payload:", payload);
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    success: true,
    message: "Post successfully scheduled via n8n workflow."
  };
};
