#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - Generate API Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Script para generar automáticamente rutas API para todas las tablas
 * 
 * Uso: node scripts/generate-api-routes.js
 */

const fs = require('fs');
const path = require('path');

const TABLES = [
  { name: 'Driver', service: 'driverService', singular: 'driver', plural: 'drivers' },
  { name: 'Company', service: 'companyService', singular: 'company', plural: 'companies' },
  { name: 'RideRequest', service: 'rideRequestService', singular: 'ride', plural: 'rides' },
  { name: 'ServiceType', service: 'serviceTypeService', singular: 'service-type', plural: 'service-types' },
  { name: 'Invoice', service: 'invoiceService', singular: 'invoice', plural: 'invoices' },
  { name: 'GeoZone', service: 'geoZoneService', singular: 'geo-zone', plural: 'geo-zones' },
  { name: 'RedZone', service: 'redZoneService', singular: 'red-zone', plural: 'red-zones' },
  { name: 'SosAlert', service: 'sosAlertService', singular: 'sos-alert', plural: 'sos-alerts' },
  { name: 'SupportTicket', service: 'supportTicketService', singular: 'support-ticket', plural: 'support-tickets' },
  { name: 'surveys', service: 'surveyService', singular: 'survey', plural: 'surveys' },
  { name: 'BonusRule', service: 'bonusRuleService', singular: 'bonus-rule', plural: 'bonus-rules' },
  { name: 'BonusLog', service: 'bonusLogService', singular: 'bonus-log', plural: 'bonus-logs' },
];

const API_BASE_PATH = path.join(__dirname, '../app/api');

function generateRouteContent(table) {
  const capitalizedName = table.name.charAt(0).toUpperCase() + table.name.slice(1);
  
  return `/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - ${capitalizedName} API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { ${table.service} } from '@/lib/supabase-service';

/**
 * GET /api/${table.plural}
 * Obtener todos los ${table.plural}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const result = await ${table.service}.getAll(filters);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      success: true,
      count: result.data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/${table.plural} error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/${table.plural}
 * Crear nuevo ${table.singular}
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await ${table.service}.create(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      { data: result.data, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/${table.plural} error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`;
}

function generateDetailRouteContent(table) {
  const capitalizedName = table.name.charAt(0).toUpperCase() + table.name.slice(1);
  
  return `/**
 * ═══════════════════════════════════════════════════════════════════════════
 * YAJA Admin Panel - ${capitalizedName} Detail API
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { ${table.service} } from '@/lib/supabase-service';

/**
 * GET /api/${table.plural}/[id]
 * Obtener un ${table.singular} por ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await ${table.service}.getById(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json({ error: '${capitalizedName} not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(\`GET /api/${table.plural}/\${params.id} error:\`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/${table.plural}/[id]
 * Actualizar un ${table.singular}
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const result = await ${table.service}.update(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data, success: true });
  } catch (error) {
    console.error(\`PUT /api/${table.plural}/\${params.id} error:\`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/${table.plural}/[id]
 * Eliminar un ${table.singular}
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await ${table.service}.delete(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(\`DELETE /api/${table.plural}/\${params.id} error:\`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
`;
}

async function generateRoutes() {
  console.log('🚀 Generando rutas API...\n');

  let createdCount = 0;

  for (const table of TABLES) {
    const dirPath = path.join(API_BASE_PATH, table.plural);
    const routePath = path.join(dirPath, 'route.ts');
    const detailDirPath = path.join(dirPath, '[id]');
    const detailRoutePath = path.join(detailDirPath, 'route.ts');

    try {
      // Crear directorio si no existe
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Generar ruta principal (GET all, POST)
      if (!fs.existsSync(routePath)) {
        fs.writeFileSync(routePath, generateRouteContent(table));
        console.log(`✅ Creado: app/api/${table.plural}/route.ts`);
        createdCount++;
      }

      // Crear directorio [id]
      if (!fs.existsSync(detailDirPath)) {
        fs.mkdirSync(detailDirPath, { recursive: true });
      }

      // Generar ruta detalle (GET id, PUT, DELETE)
      if (!fs.existsSync(detailRoutePath)) {
        fs.writeFileSync(detailRoutePath, generateDetailRouteContent(table));
        console.log(`✅ Creado: app/api/${table.plural}/[id]/route.ts`);
        createdCount++;
      }
    } catch (error) {
      console.error(`❌ Error generando rutas para ${table.plural}:`, error);
    }
  }

  console.log(`\n📊 Total de rutas generadas: ${createdCount}`);
  console.log('\n✨ Rutas API completadas!');
  console.log('\n📚 Documentación disponible en: doc/API_ROUTES.md');
}

generateRoutes().catch(console.error);
