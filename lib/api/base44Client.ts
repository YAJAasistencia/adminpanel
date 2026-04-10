/**
 * base44Client - Mock API client
 * Reemplaza esto con tu cliente real cuando esté disponible
 */

interface Entity {
  list: () => Promise<any[]>
  get: (id: string | number) => Promise<any>
  create: (data: any) => Promise<any>
  update: (id: string | number, data: any) => Promise<any>
  delete: (id: string | number) => Promise<any>
}

const createMockEntity = (name: string): Entity => ({
  list: async () => {
    console.log(`[Mock] Fetching ${name} list`)
    return []
  },
  get: async (id: string | number) => {
    console.log(`[Mock] Fetching ${name} ${id}`)
    return {}
  },
  create: async (data: any) => {
    console.log(`[Mock] Creating ${name}`, data)
    return { id: Math.random(), ...data }
  },
  update: async (id: string | number, data: any) => {
    console.log(`[Mock] Updating ${name} ${id}`, data)
    return { id, ...data }
  },
  delete: async (id: string | number) => {
    console.log(`[Mock] Deleting ${name} ${id}`)
    return { success: true }
  },
})

export const base44 = {
  entities: {
    GeoZone: createMockEntity("GeoZone"),
    Driver: createMockEntity("Driver"),
    RideRequest: createMockEntity("RideRequest"),
    Passenger: createMockEntity("Passenger"),
    ServiceType: createMockEntity("ServiceType"),
  },
}
