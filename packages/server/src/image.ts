import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

export interface ImageProvider {
  name: string;
  isConfigured(): boolean;
  generate(referenceImagePaths: string[], sceneDescription: string, prompt: string): Promise<string>;
}

class OpenAIImageProvider implements ImageProvider {
  name = 'gpt-image';
  private client: OpenAI;
  private model: string;
  private size: '1024x1024' | '1024x1536' | '1536x1024';
  private quality: 'low' | 'medium' | 'high' | 'auto';
  private outputDir: string;

  constructor(apiKey: string, outputDir: string) {
    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1.5';
    this.size = (process.env.OPENAI_IMAGE_SIZE || '1024x1024') as OpenAIImageProvider['size'];
    this.quality = (process.env.OPENAI_IMAGE_QUALITY || 'medium') as OpenAIImageProvider['quality'];
    this.outputDir = outputDir;
  }

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-'));
  }

  async generate(referenceImagePaths: string[], sceneDescription: string, prompt: string): Promise<string> {
    const fullPrompt = [
      prompt,
      '',
      'Use all uploaded reference images as a strict style sheet and character sheet. The output must look like it belongs to the exact same hand-drawn sticker pack.',
      'This is a small square cute sticker illustration, not a scene illustration, not a comic panel, not a storybook page.',
      'Character lock: white rounded head and soft white body, yellow floppy ears, green sprout with two leaves, tiny black dot eyes, tiny mouth, pink cheeks, light blue bib. Keep the same proportions and simple body shape.',
      'Style lock: fuzzy gray pencil outline, waxy crayon pastel fill, slightly blurry worn handmade texture, childlike hand-drawn softness, low-detail cute doodle. Keep the same rough brush, same softness, same simple coloring as the references.',
      'Composition lock: Mango dog is centered and large, occupying 80% to 90% of the square canvas. The character should be the image.',
      'Theme expression: use only Mango dog pose, facial expression, and at most one tiny prop to express the theme. Do not build a room, desk, bed, office, wall, landscape, or full environment.',
      'Background lock: simple pastel solid or soft gradient background, usually pale yellow, pale pink, pale green, or white. Optional tiny doodle hearts, stars, flowers, swirls, or dots around the character.',
      'No readable text anywhere. No English words, no Chinese characters, no signs, no labels, no speech bubbles. If a prompt concept suggests a sign or note, replace it with a blank cute prop or with no prop.',
      'Forbidden: detailed background, office, bed, wall, furniture, landscape, realistic lighting, 3D render, anime style, thick digital painting, changing the character design, making the dog small.',
      `Scene: ${sceneDescription}`
    ].join('\n');

    const imageFiles = await Promise.all(referenceImagePaths.map(async referenceImagePath => {
      const image = await fs.promises.readFile(referenceImagePath);
      return new File([image], path.basename(referenceImagePath), { type: mimeTypeFor(referenceImagePath) });
    }));

    const result = await this.client.images.edit({
      model: this.model,
      image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
      prompt: fullPrompt,
      size: this.size,
      quality: this.quality,
      n: 1
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('OpenAI image generation returned no image data');
    }

    await fs.promises.mkdir(this.outputDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
    const outputPath = path.join(this.outputDir, filename);
    await fs.promises.writeFile(outputPath, Buffer.from(b64, 'base64'));
    return `/uploads/generated/${filename}`;
  }
}

export function createImageProvider(uploadDir: string): ImageProvider | null {
  const provider = process.env.IMAGE_PROVIDER || 'openai';
  if (provider !== 'openai') {
    throw new Error(`Unknown IMAGE_PROVIDER: ${provider}`);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your-')) {
    return null;
  }

  return new OpenAIImageProvider(apiKey, path.join(uploadDir, 'generated'));
}

function mimeTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}
