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
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Fix "use client" position
  if (content.startsWith("import React from 'react';\n'use client';")) {
    content = content.replace("import React from 'react';\n'use client';", "'use client';\nimport React from 'react';");
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed use client in ' + file);
}
