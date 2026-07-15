import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './schema.prisma',
  migrate: {
    adapter: { provider: 'postgresql', url: process.env.DATABASE_URL },
    directUrl: process.env.DIRECT_URL,
  },
})