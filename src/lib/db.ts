// Prisma client singleton - only works when DATABASE_URL is configured
// and prisma client has been generated

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaInstance: any = null

export async function getPrisma() {
  if (prismaInstance) return prismaInstance
  if (!process.env.DATABASE_URL) return null

  try {
    // Dynamic require avoids build-time type checking against ungenerated client
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@prisma/client')
    const Client = mod.PrismaClient || mod.default?.PrismaClient
    if (!Client) return null
    prismaInstance = new Client()
    return prismaInstance
  } catch {
    return null
  }
}
