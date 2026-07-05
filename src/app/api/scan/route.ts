import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

export const runtime = 'nodejs';

const ScanResultSchema = z.object({
  name: z.string(),
  matchConfidence: z.number(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  sodium: z.number(),
  sugar: z.number(),
  healthScore: z.number(),
  ingredients: z.array(z.string()),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured on the server.' },
      { status: 500 },
    );
  }

  const body = await request.json();
  const { imageBase64, mediaType } = body as { imageBase64?: string; mediaType?: string };

  if (!imageBase64 || !mediaType) {
    return Response.json({ error: 'Missing imageBase64 or mediaType.' }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      output_config: {
        effort: 'medium',
        format: zodOutputFormat(ScanResultSchema),
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Identify the meal in this photo and estimate its nutrition. Give a short common name for the dish, a 0-100 confidence that the name matches what is shown, total calories, protein/carbs/fat/fiber/sugar in grams, sodium in milligrams, a 1-10 health score, and a list of the visible ingredients.',
            },
          ],
        },
      ],
    });

    if (response.parsed_output === null) {
      return Response.json({ error: 'Could not parse a nutrition estimate from the photo.' }, { status: 502 });
    }

    return Response.json(response.parsed_output);
  } catch (err) {
    const message = err instanceof Anthropic.APIError ? err.message : 'Unexpected error calling the AI model.';
    return Response.json({ error: message }, { status: 502 });
  }
}
