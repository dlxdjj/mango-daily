import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

export interface ImageProvider {
  name: string;
  isConfigured(): boolean;
  generate(referenceImagePath: string, sceneDescription: string, prompt: string): Promise<string>;
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

  async generate(referenceImagePath: string, sceneDescription: string, prompt: string): Promise<string> {
    const fullPrompt = [
      prompt,
      '',
      'Use the uploaded reference image as the strict character identity reference.',
      'Keep the same Mango dog IP: white round head and body, yellow floppy ears, green sprout with two leaves, light blue bib, black dot eyes, pink cheeks, soft crayon pencil hand-drawn texture.',
      'Only change the pose, props, expression, and simple scene. Do not redesign the character.',
      `Scene: ${sceneDescription}`
    ].join('\n');

    const image = await fs.promises.readFile(referenceImagePath);
    const result = await this.client.images.edit({
      model: this.model,
      image: new File([image], path.basename(referenceImagePath), { type: mimeTypeFor(referenceImagePath) }),
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
