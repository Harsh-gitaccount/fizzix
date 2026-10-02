// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prismaInstance: any = null
let initError: Error | null = null

export async function getPrisma() {
  if (prismaInstance) return prismaInstance
  if (!process.env.DATABASE_URL) return null
  if (initError) throw initError

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const adapterMod = require('@prisma/adapter-pg')
    const PrismaPg = adapterMod.PrismaPg || adapterMod.default?.PrismaPg
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const clientMod = require('@prisma/client')
    const Client = clientMod.PrismaClient || clientMod.default?.PrismaClient
    if (!Client || !PrismaPg) {
      initError = new Error('Prisma client or adapter not available')
      throw initError
    }

    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
    prismaInstance = new Client({ adapter })
    return prismaInstance
  } catch (e) {
    if (e instanceof Error && e !== initError) {
      initError = e
      console.error('Prisma client initialization failed:', e.message)
    }
    throw initError ?? e
  }
}
