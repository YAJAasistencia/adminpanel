#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dsruuvvbeudbkdpevgwd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnV1dnZiZXVkYmtkcGV2Z3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTMwODAsImV4cCI6MjA5MTMyOTA4MH0.b9pMUsCW8RN6RDLCEPmIJba2CO03BUYJi8UOvfwibCg';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  try {
    console.log('Obteniendo ciudades...');
    let { data: cities } = await supabase.from('City').select('*').order('name').limit(5);
    if (!cities) cities = [];
    console.log('Ciudades encontradas:', cities.map(c => ({ id: c.id, name: c.name })));

    let city1 = cities[0];
    let city2 = cities[1];
    let createdCity = null;

    if (!city1) {
      const cname = `TestCity-${Date.now()}`;
      const { data, error } = await supabase.from('City').insert({ name: cname }).select().single();
      if (error) throw error;
      city1 = data;
      createdCity = data;
      console.log('Se creó city:', city1);
    }

    // Inspección: obtener una muestra de Driver para ver columnas disponibles
    console.log('Inspeccionando esquema de Driver (muestra)...');
    const { data: sampleDrivers, error: sampleErr } = await supabase.from('Driver').select('*').limit(1);
    if (sampleErr) {
      console.warn('No se pudo leer muestra de Driver:', sampleErr.message);
    } else {
      console.log('Muestra Driver:', sampleDrivers);
    }

    const ts = Date.now();
    const driverPayload = {
      full_name: `Test Driver AI ${ts}`,
      email: `testdriver+${ts}@example.com`,
      phone: `999${Math.floor(Math.random() * 9000) + 1000}`,
      city_id: city1.id,
      city_name: city1.name,
      license_plate: '',
      password: 'tempPass123'
    };

    console.log('Creando driver de prueba...', driverPayload.name);
    const { data: createdDriver, error: createError } = await supabase.from('Driver').insert(driverPayload).select().single();
    if (createError) throw createError;
    console.log('Driver creado:', { id: createdDriver.id, full_name: createdDriver.full_name, city_name: createdDriver.city_name });

    if (city2 && city2.id !== city1.id) {
      console.log('Actualizando driver para asignar segunda ciudad:', city2.name);
      const { data: updated, error: updErr } = await supabase.from('Driver').update({ city_id: city2.id, city_name: city2.name }).eq('id', createdDriver.id).select().single();
      if (updErr) throw updErr;
      console.log('Driver actualizado:', { id: updated.id, city_name: updated.city_name });
    } else {
      console.log('No hay segunda ciudad; actualizando city_name (sufijo)');
      const { data: updated, error: updErr } = await supabase.from('Driver').update({ city_name: city1.name + ' (updated)' }).eq('id', createdDriver.id).select().single();
      if (updErr) throw updErr;
      console.log('Driver actualizado city_name:', updated.city_name);
    }

    const { data: finalDriver, error: finalErr } = await supabase.from('Driver').select('*').eq('id', createdDriver.id).single();
    if (finalErr) throw finalErr;
    console.log('Driver final verificado:', { id: finalDriver.id, city_id: finalDriver.city_id, city_name: finalDriver.city_name });

    // Cleanup
    const { error: delErr } = await supabase.from('Driver').delete().eq('id', createdDriver.id);
    if (delErr) console.warn('No se pudo eliminar driver creado:', delErr.message);
    if (createdCity) {
      const { error: delCityErr } = await supabase.from('City').delete().eq('id', createdCity.id);
      if (delCityErr) console.warn('No se pudo eliminar city creada:', delCityErr.message);
    }

    console.log('Prueba completada y limpieza ejecutada.');
  } catch (e) {
    console.error('ERROR en prueba:', e.message || e);
    process.exit(1);
  }
}

main();
