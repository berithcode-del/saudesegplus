import { readFileSync } from 'node:fs';
import path from 'node:path';

type LandingTemplate = {
  markup: string;
  styles: string;
};

let cachedTemplate: LandingTemplate | null = null;

function extract(source: string, regex: RegExp, label: string) {
  const match = source.match(regex);
  if (!match?.[1]) {
    throw new Error(`Nao foi possivel localizar ${label} da landing 3D.`);
  }
  return match[1].trim();
}

export function getLandingTemplate(): LandingTemplate {
  if (cachedTemplate) return cachedTemplate;

  const templatePath = path.join(
    process.cwd(),
    'components',
    'landing3d',
    'template',
    'index.html',
  );
  const source = readFileSync(templatePath, 'utf8');

  const rawStyles = extract(source, /<style>([\s\S]*?)<\/style>/i, 'os estilos');
  const rawBody = extract(source, /<body>([\s\S]*?)<\/body>/i, 'o corpo');
  const bodyWithoutScripts = rawBody.replace(/<script[\s\S]*?<\/script>/gi, '').trim();

  cachedTemplate = {
    styles: `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&display=swap');\n${rawStyles}`,
    markup: bodyWithoutScripts,
  };

  return cachedTemplate;
}
