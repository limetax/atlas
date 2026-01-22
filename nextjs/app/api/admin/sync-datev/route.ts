import { NextRequest, NextResponse } from "next/server";
import { getDatevSyncService } from "@/lib/services/datev-sync.service";

/**
 * POST /api/admin/sync-datev
 *
 * Triggers synchronization of DATEV data (clients and orders) to Supabase.
 * Fetches data via Klardaten Gateway and stores with embeddings for RAG.
 *
 * Query Parameters:
 * - year: Order year to sync (default: 2025)
 *
 * NOTE: This endpoint is UNPROTECTED for demo purposes.
 * In production, add authentication/authorization.
 */
export async function POST(request: NextRequest) {
  try {
    // Get year from query params (default to 2025)
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : 2025;

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Invalid year parameter. Must be between 2000 and 2100." },
        { status: 400 }
      );
    }

    console.log(`📡 Sync request received for year ${year}`);

    // Get sync service and run sync
    const syncService = getDatevSyncService();
    const result = await syncService.sync(year);

    if (result.success) {
      return NextResponse.json({
        message: "DATEV sync completed successfully",
        ...result,
      });
    } else {
      return NextResponse.json(
        {
          message: "DATEV sync failed",
          ...result,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Sync endpoint error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync-datev
 *
 * Health check / info endpoint for the sync service
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/admin/sync-datev",
    description: "DATEV data synchronization endpoint",
    usage: {
      method: "POST",
      parameters: {
        year: "Order year to sync (default: 2025)",
      },
      example: "POST /api/admin/sync-datev?year=2025",
    },
    environment: {
      KLARDATEN_EMAIL: process.env.KLARDATEN_EMAIL ? "configured" : "missing",
      KLARDATEN_PASSWORD: process.env.KLARDATEN_PASSWORD
        ? "configured"
        : "missing",
      KLARDATEN_INSTANCE_ID: process.env.KLARDATEN_INSTANCE_ID
        ? "configured"
        : "missing",
    },
  });
}
