/**
 * base44Client - Mock API client
 * Reemplaza esto con tu cliente real cuando esté disponible
 */

interface Entity {
  list: (filters?: any) => Promise<any[]>
  get: (id: string | number) => Promise<any>
  create: (data: any) => Promise<any>
  update: (id: string | number, data: any) => Promise<any>
  delete: (id: string | number) => Promise<any>
}

const createMockEntity = (name: string, mockData: any[] = []): Entity => ({
  list: async (filters?: any) => {
    console.log(`[Mock] Fetching ${name} list`, filters)
    let data = [...mockData]

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          data = data.filter(item => item[key] === value)
        }
      })
    }

    return data
  },
  get: async (id: string | number) => {
    console.log(`[Mock] Fetching ${name} ${id}`)
    return mockData.find(item => item.id === id) || {}
  },
  create: async (data: any) => {
    console.log(`[Mock] Creating ${name}`, data)
    const newItem = { id: Math.random().toString(36), ...data }
    mockData.push(newItem)
    return newItem
  },
  update: async (id: string | number, data: any) => {
    console.log(`[Mock] Updating ${name} ${id}`, data)
    const index = mockData.findIndex(item => item.id === id)
    if (index >= 0) {
      mockData[index] = { ...mockData[index], ...data }
      return mockData[index]
    }
    return { id, ...data }
  },
  delete: async (id: string | number) => {
    console.log(`[Mock] Deleting ${name} ${id}`)
    const index = mockData.findIndex(item => item.id === id)
    if (index >= 0) {
      mockData.splice(index, 1)
    }
    return { success: true }
  },
})

// Mock data
const mockCities = [
  { id: "1", name: "Ciudad de México", latitude: 19.4326, longitude: -99.1332, radius_km: 50 },
  { id: "2", name: "Guadalajara", latitude: 20.6597, longitude: -103.3496, radius_km: 30 },
  { id: "3", name: "Monterrey", latitude: 25.6866, longitude: -100.3161, radius_km: 25 },
]

const mockSettings = [
  {
    id: "1",
    company_name: "YAJA Asistencia",
    logo_url: "",
    accent_color: "#3B82F6",
    timezone: "America/Mexico_City",
    auto_assign_enabled: true,
    nav_config: []
  }
]

const mockSupportTickets = [
  { id: "1", status: "open", title: "Problema con pago", created_at: new Date() },
  { id: "2", status: "open", title: "Conductor no llegó", created_at: new Date() },
]

const mockChats = [
  { id: "1", unread: true, last_message: "Hola, necesito ayuda" },
]

const mockSosAlerts = [
  { id: "1", status: "active", location: "Av. Reforma 123", created_at: new Date() },
]

export const base44 = {
  entities: {
    GeoZone: createMockEntity("GeoZone"),
    Driver: createMockEntity("Driver"),
    RideRequest: createMockEntity("RideRequest"),
    Passenger: createMockEntity("Passenger"),
    ServiceType: createMockEntity("ServiceType"),
    City: createMockEntity("City", mockCities),
    Settings: createMockEntity("Settings", mockSettings),
    SupportTicket: createMockEntity("SupportTicket", mockSupportTickets),
    Chat: createMockEntity("Chat", mockChats),
    SosAlert: createMockEntity("SosAlert", mockSosAlerts),
  },
}
