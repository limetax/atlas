import { Controller, Get } from '@nestjs/common';

/**
 * Health Controller - Health check endpoint
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'lime-gpt-api',
    };
  }
}
