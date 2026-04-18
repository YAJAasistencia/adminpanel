import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokenFromHeader, requireAdmin } from '@/lib/auth-middleware';

/**
 * POST /api/assign-ride
 * 
 * Assigns a ride to the nearest available driver
 * Used after ride creation to automatically match driver
 */

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[ASSIGN-RIDE] Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { ride_id, assignment_mode } = await request.json();

    if (!ride_id) {
      return NextResponse.json(
        { error: 'ride_id is required' },
        { status: 400 }
      );
    }

    console.log(`[ASSIGN-RIDE] Processing ride ${ride_id} with mode: ${assignment_mode}`);

    // Fetch the ride
    const { data: ride, error: rideError } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('id', ride_id)
      .single();

    if (rideError || !ride) {
      console.error('[ASSIGN-RIDE] Ride not found:', rideError?.message);
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }

    // If already assigned, return
    if (ride.driver_id) {
      console.log(`[ASSIGN-RIDE] Ride ${ride_id} already assigned to ${ride.driver_id}`);
      return NextResponse.json({
        success: true,
        message: 'Ride already assigned',
        driver_id: ride.driver_id
      });
    }

    // Get app settings for auction configuration
    const { data: settings } = await supabase
      .from('app_settings')
      .select('auto_assign_nearest_driver,auction_mode_enabled,auction_primary_radius_km,auction_timeout_seconds')
      .single();

    console.log('[ASSIGN-RIDE] Settings:', settings);

    // Determine which assignment mode to use
    const useAuction = assignment_mode === 'auction' || settings?.auction_mode_enabled;
    const useAutoAssign = !useAuction && (assignment_mode === 'auto' || settings?.auto_assign_nearest_driver);

    // Mode: AUCTION
    if (useAuction && ride.status === 'auction') {
      console.log('[ASSIGN-RIDE] Entering AUCTION mode');
      const radius = settings?.auction_primary_radius_km || 10;
      
      // Find available drivers within auction_primary_radius
      const { data: drivers, error: driversError } = await supabase
        .rpc('find_nearby_drivers', {
          latitude: ride.pickup_lat,
          longitude: ride.pickup_lon,
          radius_km: radius,
          status: 'available'
        });

      if (driversError) {
        console.warn('[ASSIGN-RIDE] RPC error finding drivers:', driversError.message);
        // Fallback: simple query
        const { data: fallbackDrivers } = await supabase
          .from('Driver')
          .select('id,full_name,latitude,longitude,email')
          .eq('status', 'available')
          .eq('approval_status', 'approved')
          .limit(10);

        if (fallbackDrivers && fallbackDrivers.length > 0) {
          console.log(`[ASSIGN-RIDE] Found ${fallbackDrivers.length} drivers via fallback`);
          
          // Update to auction status if not already
          await supabase
            .from('ride_requests')
            .update({ status: 'auction' })
            .eq('id', ride_id);

          // Send notifications to first 5 drivers
          const targetDrivers = fallbackDrivers.slice(0, 5);
          for (const driver of targetDrivers) {
            console.log(`[ASSIGN-RIDE] Notifying driver ${driver.id} about ride ${ride_id}`);
            try {
              await fetch(`${new URL(request.url).origin}/api/notify-driver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  driver_id: driver.id,
                  ride_id: ride_id,
                  notification_type: 'ride_offer',
                  message: `Nueva oferta de viaje: ${ride.pickup_address}`,
                  ride_data: {
                    pickup_address: ride.pickup_address,
                    dropoff_address: ride.dropoff_address,
                    estimated_price: ride.estimated_price,
                    passenger_name: ride.passenger_name
                  }
                })
              });
            } catch (e) {
              console.error(`[ASSIGN-RIDE] Failed to notify driver ${driver.id}:`, e);
            }
          }

          return NextResponse.json({
            success: true,
            mode: 'auction',
            drivers_notified: targetDrivers.length,
            message: `Auction set for ${targetDrivers.length} drivers`
          });
        }
      } else if (drivers && drivers.length > 0) {
        console.log(`[ASSIGN-RIDE] Found ${drivers.length} drivers via RPC`);
        
        // Send notifications to drivers
        const targetDrivers = drivers.slice(0, 5);
        for (const driver of targetDrivers) {
          try {
            await fetch(`${new URL(request.url).origin}/api/notify-driver`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                driver_id: driver.id,
                ride_id: ride_id,
                notification_type: 'ride_offer',
                message: `Nueva oferta de viaje: ${ride.pickup_address}`
              })
            });
          } catch (e) {
            console.error(`[ASSIGN-RIDE] Failed to notify driver ${driver.id}:`, e);
          }
        }

        return NextResponse.json({
          success: true,
          mode: 'auction',
          drivers_notified: targetDrivers.length,
          message: `Auction set for ${targetDrivers.length} drivers`
        });
      }
    }

    // Mode: AUTO ASSIGN (find nearest and assign)
    if (useAutoAssign || (!useAuction && !ride.driver_id)) {
      console.log('[ASSIGN-RIDE] Entering AUTO ASSIGN mode');
      
      // Find nearest available driver using RPC
      const { data: drivers, error: driversError } = await supabase
        .rpc('find_nearby_drivers', {
          latitude: ride.pickup_lat,
          longitude: ride.pickup_lon,
          radius_km: 15,
          status: 'available'
        });

      if (driversError) {
        console.warn('[ASSIGN-RIDE] RPC error:', driversError.message);
        // Fallback: query closest driver
        const { data: fallbackDriver } = await supabase
          .from('Driver')
          .select('id,full_name,latitude,longitude,email')
          .eq('status', 'available')
          .eq('approval_status', 'approved')
          .not('latitude', 'is', null)
          .limit(1);

        if (fallbackDriver && fallbackDriver.length > 0) {
          const driver = fallbackDriver[0];
          console.log(`[ASSIGN-RIDE] Assigning to driver ${driver.id} (fallback)`);

          // Update ride with driver assignment
          const { error: updateError } = await supabase
            .from('ride_requests')
            .update({
              driver_id: driver.id,
              status: 'assigned'
            })
            .eq('id', ride_id);

          if (updateError) {
            console.error('[ASSIGN-RIDE] Failed to update ride:', updateError.message);
            return NextResponse.json(
              { error: 'Failed to assign driver' },
              { status: 500 }
            );
          }

          console.log(`[ASSIGN-RIDE] ✅ Ride assigned to driver ${driver.id}`);

          // Notify driver
          try {
            await fetch(`${new URL(request.url).origin}/api/notify-driver`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                driver_id: driver.id,
                ride_id: ride_id,
                notification_type: 'ride_assigned',
                message: `Viaje asignado: ${ride.pickup_address}`,
                ride_data: {
                  pickup_address: ride.pickup_address,
                  dropoff_address: ride.dropoff_address,
                  estimated_price: ride.estimated_price,
                  passenger_name: ride.passenger_name
                }
              })
            });
          } catch (e) {
            console.error('[ASSIGN-RIDE] Failed to notify driver:', e);
          }

          return NextResponse.json({
            success: true,
            mode: 'auto_assign',
            driver_id: driver.id,
            driver_name: driver.full_name,
            message: 'Driver assigned successfully'
          });
        }
      } else if (drivers && drivers.length > 0) {
        const driver = drivers[0];
        console.log(`[ASSIGN-RIDE] Assigning to driver ${driver.id}`);

        // Update ride with driver assignment
        const { error: updateError } = await supabase
          .from('ride_requests')
          .update({
            driver_id: driver.id,
            status: 'assigned'
          })
          .eq('id', ride_id);

        if (updateError) {
          console.error('[ASSIGN-RIDE] Failed to update ride:', updateError.message);
          return NextResponse.json(
            { error: 'Failed to assign driver' },
            { status: 500 }
          );
        }

        console.log(`[ASSIGN-RIDE] ✅ Ride assigned to driver ${driver.id}`);

        // Notify driver
        try {
          await fetch(`${new URL(request.url).origin}/api/notify-driver`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              driver_id: driver.id,
              ride_id: ride_id,
              notification_type: 'ride_assigned',
              message: `Viaje asignado: ${ride.pickup_address}`,
              ride_data: {
                pickup_address: ride.pickup_address,
                dropoff_address: ride.dropoff_address,
                estimated_price: ride.estimated_price,
                passenger_name: ride.passenger_name
              }
            })
          });
        } catch (e) {
          console.error('[ASSIGN-RIDE] Failed to notify driver:', e);
        }

        return NextResponse.json({
          success: true,
          mode: 'auto_assign',
          driver_id: driver.id,
          driver_name: driver.full_name,
          message: 'Driver assigned successfully'
        });
      }
    }

    // No driver found
    console.warn('[ASSIGN-RIDE] ⚠️ No available drivers found');
    return NextResponse.json({
      success: false,
      mode: assignment_mode,
      message: 'No available drivers found in the service area',
      requiresManualAssignment: true
    }, { status: 202 });

  } catch (error: any) {
    console.error('[ASSIGN-RIDE] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
