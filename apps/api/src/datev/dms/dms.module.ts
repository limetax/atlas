import { KlardatenClientModule } from '@/datev/infrastructure/klardaten/klardaten.module';
import { DmsAdapter } from '@datev/dms/domain/dms.adapter';
import { KlardatenDmsAdapter } from '@datev/dms/infrastructure/klardaten-dms.adapter';
import { Module } from '@nestjs/common';

/**
 * DmsModule - DATEV DMS (Document Management System) bounded context.
 * Physically nested under datev/ since DMS is a DATEV product.
 *
 * Consumers import this module directly for DMS access — they do not need
 * to know about Klardaten or the underlying transport.
 */
@Module({
  imports: [KlardatenClientModule],
  providers: [{ provide: DmsAdapter, useClass: KlardatenDmsAdapter }],
  exports: [DmsAdapter],
})
export class DmsModule {}
