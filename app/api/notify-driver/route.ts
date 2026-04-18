import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/notify-driver
 * 
 * Sends a notification to a driver about a new ride offer/assignment
 * Uses Supabase Realtime to instantly notify the driver app
 */

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[NOTIFY-DRIVER] Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      driver_id,
      ride_id,
      notification_type = 'ride_offer', // 'ride_offer', 'ride_assigned', 'ride_cancelled'
      message,
      ride_data
    } = await request.json();

    if (!driver_id || !ride_id) {
      return NextResponse.json(
        { error: 'driver_id and ride_id are required' },
        { status: 400 }
      );
    }

    console.log(`[NOTIFY-DRIVER] Notifying driver ${driver_id} about ride ${ride_id}`);

    // Create notification record in database
    const { data: notification, error: notificationError } = await supabase
      .from('driver_notificaciones')
      .insert({
        driver_id,
        ride_id,
        type: notification_type,
        message,
        data: ride_data || {},
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (notificationError) {
      console.warn(`[NOTIFY-DRIVER] Failed to create notification record:`, notificationError.message);
      // Don't fail the entire operation, continue with realtime broadcast
    }

    // Broadcast via Supabase Realtime to driver app
    // The driver app should listen on channel: `driver:${driver_id}:incoming-rides`
    const broadcastChannel = `driver:${driver_id}:incoming-rides`;
    
    const { error: broadcastError } = await supabase
      .channel(broadcastChannel)
      .send('broadcast', {
        event: 'new_ride_notification',
        payload: {
          ride_id,
          driver_id,
          notification_type,
          message,
          ride_data,
          timestamp: new Date().toISOString(),
          notification_id: notification?.id
        }
      });

    if (broadcastError) {
      console.warn(`[NOTIFY-DRIVER] Realtime broadcast error:`, broadcastError.message);
      // This might fail in dev, but notification record was created
    }

    console.log(`[NOTIFY-DRIVER] ✅ Notification sent via ${broadcastChannel}`);

    // Also subscribe to presence channel for driver activity
    // This allows admin to see driver status updates in real-time
    const presenceChannel = `drivers:active`;
    await supabase
      .channel(presenceChannel)
      .track({
        driver_id,
        status: 'received_ride',
        ride_id,
        timestamp: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      notification_id: notification?.id,
      channel: broadcastChannel,
      message: 'Driver notification sent'
    });

  } catch (error: any) {
    console.error('[NOTIFY-DRIVER] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
