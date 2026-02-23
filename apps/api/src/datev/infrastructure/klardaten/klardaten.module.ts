import { KlardatenClient } from '@/datev/infrastructure/klardaten/klardaten.client';
import { Module } from '@nestjs/common';

/**
 * KlardatenClientModule - Provides the shared Klardaten HTTP client within the DATEV domain.
 * Import this module wherever Klardaten API access is needed (datev sync, DMS, future products).
 */
@Module({
  providers: [KlardatenClient],
  exports: [KlardatenClient],
})
export class KlardatenClientModule {}
