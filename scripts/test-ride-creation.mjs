#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dsruuvvbeudbkdpevgwd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnV1dnZiZXVkYmtkcGV2Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTMwODAsImV4cCI6MjA5MTMyOTA4MH0.b9pMUsCW8RN6RDLCEPmIJba2CO03BUYJi8UOvfwibCg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  try {
    console.log('=== Prueba de creación de viaje ===\n');

    // 1. Obtener servicio disponible
    console.log('1. Obteniendo tipo de servicio...');
    let { data: services, error: svcErr } = await supabase.from('ServiceType').select('id, name, base_price, price_per_km, minimum_fare').limit(1);
    if (svcErr) {
      console.error('Error al obtener servicios:', svcErr.message);
      return;
    }
    if (!services || services.length === 0) {
      console.warn('No hay servicios disponibles. Creando uno de prueba...');
      const { data: newSvc, error: createSvcErr } = await supabase.from('ServiceType').insert({
        name: `TestService-${Date.now()}`,
        category: 'Servicios',
        base_price: 50,
        price_per_km: 5,
        minimum_fare: 30,
        is_active: true,
      }).select().single();
      if (createSvcErr) {
        console.error('Error creando servicio:', createSvcErr.message);
        return;
      }
      services = [newSvc];
    }

    const service = services[0];
    console.log(`✓ Servicio: ${service.name} (${service.base_price} + ${service.price_per_km}/km)\n`);

    // 2. Crear viaje de prueba mínimo
    console.log('2. Creando viaje de prueba...');
    const rideData = {
      passenger_name: `Pasajero Test ${Date.now()}`,
      passenger_phone: '+525500000000',
      pickup_address: 'Av. Paseo de la Reforma 505, CDMX',
      dropoff_address: 'Av. Reforma 303, CDMX',
      service_type_name: service.name,
      service_type_id: service.id,
      estimated_price: service.base_price,
      distance_km: 1,
      duration_minutes: 5,
      payment_method: 'cash',
      status: 'pending',
      assignment_mode: 'auto',
      ride_type: 'normal',
      service_id: `TST-${Date.now()}`,
      requested_at: new Date().toISOString(),
      pickup_lat: 25.2866,
      pickup_lon: -110.9731,
      dropoff_lat: 25.2877,
      dropoff_lon: -110.9720,
      notes: 'Viaje de prueba API',
    };

    console.log('Datos a insertar:', {
      passenger: rideData.passenger_name,
      service: rideData.service_type_name,
      pickup: rideData.pickup_address,
      status: rideData.status,
    });

    const { data: createdRide, error: createErr } = await supabase
      .from('RideRequest')
      .insert(rideData)
      .select()
      .single();

    if (createErr) {
      console.error('❌ Error creando viaje:');
      console.error('   Código:', createErr.code);
      console.error('   Mensaje:', createErr.message);
      console.error('   Detalles:', createErr.details);
      console.error('\nSoluciones sugeridas:');
      if (createErr.message.includes('RLS')) {
        console.error('   • Revisa las políticas de RLS en la tabla RideRequest');
        console.error('   • Asegúrate de que el usuario anon puede INSERT');
      }
      if (createErr.message.includes('violates')) {
        console.error('   • Hay campos obligatorios faltantes o con valores inválidos');
        console.error('   • Revisa los constraint de la tabla');
      }
      return;
    }

    console.log('✅ Viaje creado exitosamente');
    console.log(`   ID: ${createdRide.id}`);
    console.log(`   Pasajero: ${createdRide.passenger_name}`);
    console.log(`   Status: ${createdRide.status}\n`);

    // 3. Verificar que se puede leer
    console.log('3. Verificando lectura del viaje...');
    const { data: readRide, error: readErr } = await supabase
      .from('RideRequest')
      .select('*')
      .eq('id', createdRide.id)
      .single();

    if (readErr) {
      console.error('❌ Error leyendo viaje:', readErr.message);
      return;
    }

    console.log('✅ Viaje leído correctamente');
    console.log(`   Confirmado: ${readRide.passenger_name} → ${readRide.pickup_address}\n`);

    // 4. Limpiar
    console.log('4. Limpiando datos de prueba...');
    const { error: delErr } = await supabase.from('RideRequest').delete().eq('id', createdRide.id);
    if (delErr) {
      console.warn('⚠️  No se pudo eliminar el viaje de prueba:', delErr.message);
    } else {
      console.log('✅ Viaje de prueba eliminado\n');
    }

    console.log('=== Prueba completada exitosamente ===');

  } catch (error) {
    console.error('Error no controlado:', error);
  }
}

main();
