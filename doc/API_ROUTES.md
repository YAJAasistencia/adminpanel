/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - API Routes Registry
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Guía de rutas API disponibles
 */

const API_ROUTES = {
  // Cities
  'GET    /api/cities': 'List all cities',
  'POST   /api/cities': 'Create new city',
  'GET    /api/cities/[id]': 'Get city details',
  'PUT    /api/cities/[id]': 'Update city',
  'DELETE /api/cities/[id]': 'Delete city',

  // Drivers
  'GET    /api/drivers': 'List all drivers',
  'POST   /api/drivers': 'Create new driver',
  'GET    /api/drivers/[id]': 'Get driver details',
  'PUT    /api/drivers/[id]': 'Update driver',
  'DELETE /api/drivers/[id]': 'Delete driver',
  'GET    /api/drivers/[id]/stats': 'Get driver statistics',

  // Companies
  'GET    /api/companies': 'List all companies',
  'POST   /api/companies': 'Create new company',
  'GET    /api/companies/[id]': 'Get company details',
  'PUT    /api/companies/[id]': 'Update company',
  'DELETE /api/companies/[id]': 'Delete company',

  // Rides
  'GET    /api/rides': 'List all rides',
  'POST   /api/rides': 'Create new ride',
  'GET    /api/rides/[id]': 'Get ride details',
  'PUT    /api/rides/[id]': 'Update ride',
  'DELETE /api/rides/[id]': 'Delete ride',

  // Service Types
  'GET    /api/service-types': 'List all service types',
  'POST   /api/service-types': 'Create new service type',
  'GET    /api/service-types/[id]': 'Get service type details',
  'PUT    /api/service-types/[id]': 'Update service type',
  'DELETE /api/service-types/[id]': 'Delete service type',

  // Invoices
  'GET    /api/invoices': 'List all invoices',
  'POST   /api/invoices': 'Create new invoice',
  'GET    /api/invoices/[id]': 'Get invoice details',
  'PUT    /api/invoices/[id]': 'Update invoice',

  // Geo Zones
  'GET    /api/geo-zones': 'List all geo zones',
  'POST   /api/geo-zones': 'Create new geo zone',
  'GET    /api/geo-zones/[id]': 'Get geo zone details',
  'PUT    /api/geo-zones/[id]': 'Update geo zone',
  'DELETE /api/geo-zones/[id]': 'Delete geo zone',

  // Red Zones (Prohibited areas)
  'GET    /api/red-zones': 'List all red zones',
  'POST   /api/red-zones': 'Create new red zone',
  'GET    /api/red-zones/[id]': 'Get red zone details',
  'PUT    /api/red-zones/[id]': 'Update red zone',
  'DELETE /api/red-zones/[id]': 'Delete red zone',

  // SOS Alerts
  'GET    /api/sos-alerts': 'List all SOS alerts',
  'POST   /api/sos-alerts': 'Create new SOS alert',
  'GET    /api/sos-alerts/[id]': 'Get SOS alert details',
  'PUT    /api/sos-alerts/[id]': 'Update SOS alert',

  // Support Tickets
  'GET    /api/support-tickets': 'List all support tickets',
  'POST   /api/support-tickets': 'Create new support ticket',
  'GET    /api/support-tickets/[id]': 'Get support ticket details',
  'PUT    /api/support-tickets/[id]': 'Update support ticket',

  // Health Check
  'GET    /api/health': 'API health status',
};

/**
 * Servicios disponibles para cada tabla
 * 
 * import {
 *   cityService,
 *   driverService,
 *   companyService,
 *   rideRequestService,
 *   serviceTypeService,
 *   invoiceService,
 *   bonusRuleService,
 *   bonusLogService,
 *   geoZoneService,
 *   redZoneService,
 *   sosAlertService,
 *   supportTicketService,
 *   surveyService,
 *   surveyResponseService,
 *   driverNotificationService,
 *   chatMessageService,
 *   cancellationPolicyService,
 *   appSettingsService,
 *   adminUserService,
 * } from '@/lib/supabase-service';
 */

/**
 * Métodos disponibles en cada servicio
 * 
 * - getAll(filters?, options?) → { data, success, error }
 * - getById(id, options?) → { data, success, error }
 * - create(data, options?) → { data, success, error }
 * - update(id, data, options?) → { data, success, error }
 * - delete(id) → { success, error }
 * - search(term, columns) → { data, success, error }
 * - count(filters?) → { count, success, error }
 * - batchCreate(dataArray) → { data, success, error }
 * - query(filters, options?) → { data, success, error }
 */

export default API_ROUTES;
