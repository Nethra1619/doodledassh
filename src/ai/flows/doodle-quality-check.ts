'use server';

/**
 * @fileOverview A doodle quality check AI agent.
 *
 * - doodleQualityCheck - A function that checks whether a doodle is scribbles or an actual doodle.
 * - DoodleQualityCheckInput - The input type for the doodleQualityCheck function.
 * - DoodleQualityCheckOutput - The return type for the doodleQualityCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DoodleQualityCheckInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a doodle, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DoodleQualityCheckInput = z.infer<typeof DoodleQualityCheckInputSchema>;

const DoodleQualityCheckOutputSchema = z.object({
  isScribble: z
    .boolean()
    .describe('Whether or not the doodle is just scribbles.'),
  feedback: z
    .string()
    .describe('Feedback to the user about their doodle.'),
});
export type DoodleQualityCheckOutput = z.infer<typeof DoodleQualityCheckOutputSchema>;

export async function doodleQualityCheck(input: DoodleQualityCheckInput): Promise<DoodleQualityCheckOutput> {
  return doodleQualityCheckFlow(input);
}

const prompt = ai.definePrompt({
  name: 'doodleQualityCheckPrompt',
  input: {schema: DoodleQualityCheckInputSchema},
  output: {schema: DoodleQualityCheckOutputSchema},
  prompt: `You are an AI assistant that helps determine the quality of a user's doodle.

You will be given a photo of a doodle, and you will determine whether or not it is just scribbles.

If it is just scribbles, you will set the isScribble output field to true, and provide feedback to the user encouraging them to try harder.
If it is not just scribbles, you will set the isScribble output field to false, and provide positive feedback to the user.

Photo: {{media url=photoDataUri}}`,
});

const doodleQualityCheckFlow = ai.defineFlow(
  {
    name: 'doodleQualityCheckFlow',
    inputSchema: DoodleQualityCheckInputSchema,
    outputSchema: DoodleQualityCheckOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
