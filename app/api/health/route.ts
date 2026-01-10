/**
 * GET /api/health
 *
 * Health check endpoint for Coolify monitoring
 * Returns service status and basic metadata
 */
export async function GET() {
  return Response.json({
    status: "ok",
    service: "limetaxIQ",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
}
