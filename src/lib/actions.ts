"use server";

import { identifyBottlenecks } from "@/ai/flows/identify-bottlenecks";
import { z } from "zod";

const actionSchema = z.object({
  serviceRequestData: z.string(),
});

export async function getBottleneckAnalysis(data: { serviceRequestData: string }): Promise<{ analysis?: string; error?: string }> {
  const validatedData = actionSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: "Invalid input data." };
  }

  try {
    const result = await identifyBottlenecks(validatedData.data);
    return { analysis: result.bottleneckAnalysis };
  } catch (e) {
    console.error("Error in getBottleneckAnalysis:", e);
    // This provides a more user-friendly error message.
    if (e instanceof Error && e.message.includes('API key not found')) {
        return { error: 'The AI service is not configured. Please check the server configuration.' };
    }
    return { error: "An unexpected error occurred while analyzing the data." };
  }
}
