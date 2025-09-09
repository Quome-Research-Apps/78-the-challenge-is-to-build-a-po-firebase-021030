'use server';

/**
 * @fileOverview This file defines a Genkit flow for identifying bottlenecks in 311 service request data.
 *
 * It takes 311 service request data as input and uses an LLM to identify common causes for delays.
 * - identifyBottlenecks - A function that handles the bottleneck identification process.
 * - IdentifyBottlenecksInput - The input type for the identifyBottlenecks function.
 * - IdentifyBottlenecksOutput - The return type for the identifyBottlenecks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyBottlenecksInputSchema = z.object({
  serviceRequestData: z
    .string()
    .describe(
      'A CSV or JSON string containing 311 service request data.  The data should include fields such as request type, creation date, resolution date, and any other relevant information.'
    ),
});
export type IdentifyBottlenecksInput = z.infer<typeof IdentifyBottlenecksInputSchema>;

const IdentifyBottlenecksOutputSchema = z.object({
  bottleneckAnalysis: z
    .string()
    .describe(
      'A detailed analysis of common bottlenecks or causes for delays in resolving specific types of 311 service requests.'
    ),
});
export type IdentifyBottlenecksOutput = z.infer<typeof IdentifyBottlenecksOutputSchema>;

export async function identifyBottlenecks(
  input: IdentifyBottlenecksInput
): Promise<IdentifyBottlenecksOutput> {
  return identifyBottlenecksFlow(input);
}

const identifyBottlenecksPrompt = ai.definePrompt({
  name: 'identifyBottlenecksPrompt',
  input: {schema: IdentifyBottlenecksInputSchema},
  output: {schema: IdentifyBottlenecksOutputSchema},
  prompt: `You are an expert city operations analyst tasked with identifying bottlenecks in 311 service request data.

  Analyze the following 311 service request data to identify common causes for delays in resolving specific types of requests. Provide a detailed analysis of the bottlenecks, including specific examples from the data.

  Data: {{{serviceRequestData}}}

  Consider factors such as request volume, resolution times, and request types.
  Focus on identifying actionable insights that can help improve the efficiency of city services.
  Your analysis should be clear, concise, and easy to understand for a city manager.
  `,
});

const identifyBottlenecksFlow = ai.defineFlow(
  {
    name: 'identifyBottlenecksFlow',
    inputSchema: IdentifyBottlenecksInputSchema,
    outputSchema: IdentifyBottlenecksOutputSchema,
  },
  async input => {
    const {output} = await identifyBottlenecksPrompt(input);
    return output!;
  }
);
