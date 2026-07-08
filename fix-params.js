const fs = require('fs');

const files = [
  'apps/web/app/p/[token]/page.tsx',
  'apps/web/app/p/[token]/teleconsulta/page.tsx',
  'apps/web/app/p/[token]/questionario/page.tsx',
  'apps/web/app/p/[token]/processo/page.tsx',
  'apps/web/app/p/[token]/documentos/page.tsx',
  'apps/web/app/p/[token]/confirmar/page.tsx',
  'apps/web/app/p/[token]/aso/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Skipping ' + file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');

  // Change the signature
  content = content.replace(/params\s*:\s*\{\s*token\s*:\s*string\s*\}/g, 'params: Promise<{ token: string }>');

  // Find export default function XYZ({ params }: { params: Promise<{ token: string }> }) {
  content = content.replace(/(export\s+default\s+function\s+\w+\(\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*Promise<\{\s*token\s*:\s*string\s*\}>\s*\}\)\s*\{)/g,
    "$1\n  const { token } = React.use(params);");

  // Replace params.token with token
  content = content.replace(/params\.token/g, 'token');

  // Add React import if not present
  if (!content.includes('import React') && !content.includes('import * as React')) {
    content = "import React from 'react';\n" + content;
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
}
