# Phase 1.1 - Klardaten Core Tables Implementation

**Linear Issue:** TEC-42  
**Date:** 2026-01-30  
**Status:** Implementation Complete ✅

## What Was Implemented

### 1. Packages Installed ✅

```bash
- axios ^1.13.4 - HTTP client
- axios-retry ^4.5.0 - Automatic retry logic
- date-fns ^4.1.0 - Date filtering
- p-limit ^7.2.0 - Concurrency control
```

### 2. Database Migration ✅

**File:** `004_klardaten_core_tables.sql`

**Tables Created:**

1. `datev_addressees` - Person/entity details (50+ fields)
2. `datev_clients` - Enhanced client data with FK refs (80+ fields)
3. `datev_accounting_postings` - Transaction-level data with heavy indexes
4. `datev_susa` - Trial balance aggregates
5. `datev_documents` - Document metadata (no files, s3_key=NULL)

**Features:**

- Drops old tables (datev_clients, datev_orders) - clean slate
- Exact Klardaten API field mappings
- Metadata JSONB columns for efficient filtering
- HNSW vector indexes + B-tree composite indexes
- 5 new vector search functions with metadata filtering
- Row Level Security (RLS) policies

### 3. TypeScript Types ✅

**File:** `packages/shared/src/types/datev.ts`

**Added:**

- Enhanced `DatevClient` interface (80+ fields, FK references)
- `DatevAddressee` interface
- `DatevPosting` interface
- `DatevSusa` interface
- `DatevDocument` interface
- Match types for all entities
- Updated `DatevSyncResult` for new tables

### 4. Klardaten Client Refactor ✅

**File:** `apps/api/src/datev/infrastructure/klardaten.client.ts`

**Changes:**

- ✅ Replaced `fetch` with `axios`
- ✅ Added `axios-retry` with exponential backoff (3 retries)
- ✅ Request/response interceptors for auth and logging
- ✅ 5 new API methods:
  - `getAddressees()` - Fetch all addressees
  - `getAccountingPostings(clientId, year)` - Paginated, 2025+ filtered
  - `getSusa(clientId, year)` - Monthly trial balance
  - `getDocuments(clientId?)` - Document metadata, 2025+ filtered
- ✅ 2025-01-01 date filtering in postings and documents
- ✅ Pagination for high-volume endpoints (1000 per batch)

### 5. Sync Service Complete Rewrite ✅

**File:** `apps/api/src/datev/application/datev-sync.service.ts`

**New Sync Flow:**

```
1. Authenticate with Klardaten
2. Sync addressees
3. Sync clients with addressee denormalization
4. For each active client:
   - Sync postings (batched 100 at a time for embedding generation)
   - Sync SUSA entries
   - Sync documents (metadata only)
5. Return comprehensive sync result
```

**Key Features:**

- Addressee denormalization: Managing director info embedded in client text
- Per-client batching: Prevents timeouts for 100k+ postings
- Concurrent embedding generation: Batch of 100 processed in parallel
- Progress logging: Feedback every 1000 postings
- Rich embeddings: Denormalized context in German
- Metadata population: All JSONB fields populated for filtering

**Embedding Strategies:**

- **Clients:** Name + form + managing director + industry + location + org + status
- **Postings:** Client + date + account + amount + direction + text + document
- **SUSA:** Client + period + account + movements + balance + count
- **Documents:** Client + filename + type + size + date + keywords + folder

### 6. Vector Store Search Methods ✅

**Files:**

- `apps/api/src/rag/domain/vector-store.interface.ts` - Interface definitions
- `apps/api/src/rag/infrastructure/supabase-vector.adapter.ts` - Implementations

**Added Methods:**

- `searchDatevAddressees(embedding, threshold, count, filters?)` - Addressee search
- `searchDatevPostings(embedding, threshold, count, filters?)` - Posting search with 6 filter params
- `searchDatevSusa(embedding, threshold, count, filters?)` - SUSA search with balance filtering
- `searchDatevDocuments(embedding, threshold, count, filters?)` - Document search

**Filter Support:**

- Addressees: type, is_legal_representative
- Postings: client_id, fiscal_year, account_number, date_from, date_to, min_amount
- SUSA: client_id, fiscal_year, account_number, negative_balance
- Documents: client_id, year, extension, date_from

## How to Run Migration

### Option 1: Local Supabase (Docker)

```bash
cd supabase-project
docker compose up -d
# Wait for containers to start

# Run migration
docker exec -it supabase-project-db-1 psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/004_klardaten_core_tables.sql

# Or copy to container first:
docker cp ../database/migrations/004_klardaten_core_tables.sql supabase-project-db-1:/tmp/
docker exec -it supabase-project-db-1 psql -U postgres -d postgres -f /tmp/004_klardaten_core_tables.sql
```

### Option 2: Supabase Cloud (if using remote)

```bash
# Using supabase CLI
cd database/migrations
supabase db push --linked

# Or via SQL editor in Supabase Dashboard
# Copy/paste 004_klardaten_core_tables.sql content
```

### Option 3: Direct psql (if you have connection string)

```bash
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f database/migrations/004_klardaten_core_tables.sql
```

## How to Test Sync

### 1. Check Environment Variables

Ensure these are set in `apps/api/.env`:

```bash
KLARDATEN_EMAIL=your-email@example.com
KLARDATEN_PASSWORD=your-password
KLARDATEN_INSTANCE_ID=your-instance-id
SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Start API Server

```bash
cd apps/api
pnpm dev
```

### 3. Trigger Sync via tRPC

**Option A: Using TypeScript Test Script**

```typescript
// test-sync.ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@atlas/api/@generated';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/api/trpc',
      headers: {
        Authorization: 'Bearer YOUR_AUTH_TOKEN',
      },
    }),
  ],
});

async function testSync() {
  console.log('Starting Klardaten sync...');
  const result = await client.datev.sync.mutate({ orderYear: 2025 });
  console.log('Sync result:', JSON.stringify(result, null, 2));
}

testSync();
```

**Option B: Using curl (if auth not required for dev)**

```bash
curl -X POST http://localhost:3001/api/trpc/datev.sync \
  -H "Content-Type: application/json" \
  -d '{"orderYear": 2025}'
```

**Option C: Via Web App**

- Frontend tRPC client in `apps/web/src/lib/trpc.ts` handles batching automatically
- Create a UI button that calls `trpc.datev.sync.useMutation()`

### 4. Verify Data in Database

```sql
-- Check addressees
SELECT COUNT(*) FROM datev_addressees;
SELECT full_name, addressee_type, main_email FROM datev_addressees LIMIT 5;

-- Check clients with managing director info
SELECT
  client_name,
  company_form,
  managing_director_name,
  managing_director_email
FROM datev_clients
LIMIT 5;

-- Check postings (should all be >= 2025-01-01)
SELECT COUNT(*) FROM datev_accounting_postings;
SELECT MIN(date), MAX(date) FROM datev_accounting_postings;
SELECT
  client_name,
  date,
  account_number,
  amount,
  posting_description
FROM datev_accounting_postings
LIMIT 10;

-- Check SUSA
SELECT COUNT(*) FROM datev_susa;
SELECT client_name, fiscal_year, month, account_number, balance
FROM datev_susa
WHERE balance < 0  -- Negative balances
LIMIT 10;

-- Check documents
SELECT COUNT(*) FROM datev_documents;
SELECT client_id, description, extension, import_date_time
FROM datev_documents
LIMIT 5;
```

### 5. Test Vector Search

```sql
-- Test client search (need to generate embedding first)
-- This would be done via RAG service in actual usage

-- Check embeddings are generated
SELECT
  client_name,
  LENGTH(embedding_text) as text_length,
  embedding IS NOT NULL as has_embedding
FROM datev_clients
LIMIT 5;

-- Check embedding text quality
SELECT client_name, embedding_text FROM datev_clients LIMIT 3;
```

## Expected Results

### After Successful Sync:

**Addressees:**

- ~50-500 records depending on client count
- All have embeddings generated
- Includes managing directors, shareholders, etc.

**Clients:**

- All existing clients from Klardaten
- Each has `managing_director_name` populated (if natural_person_id exists)
- Embedding text includes denormalized addressee context
- Example: "Mandant: ACME GmbH (Mandantennummer: 1001, Rechtsform: GmbH) - Geschäftsführer: Max Mustermann (max@acme.de, +49-89-123456) - Branche: Steuerberatung - Standort: München..."

**Postings:**

- 0 to 100k+ per client (depends on transaction volume)
- All postings >= 2025-01-01 only
- Embedding text: "Buchung für ACME GmbH - Datum: 15.01.2025 - Konto 1200 (Bank) → 4000 (Erlöse) - Soll: 5.000,00 EUR - Buchungstext: Einzahlung..."

**SUSA:**

- ~12 entries per client per year (one per month)
- Includes opening/closing balances and movements
- Embedding text: "Summen und Salden für ACME GmbH - Jahr 2025, Monat 01 - Konto 1200 (Bank) - Anfang: 10.000 EUR..."

**Documents:**

- Metadata only, no file content
- All documents imported >= 2025-01-01
- `s3_key` field is NULL (S3 integration in Phase 1.2)
- Embedding text: "Dokument für ACME GmbH: Jahresabschluss_2024.pdf - Typ: PDF - Hochgeladen: 15.01.2025..."

## Success Criteria Checklist

- [ ] Migration runs without errors
- [ ] All 5 tables created with correct schema
- [ ] Addressees synced successfully
- [ ] Clients synced with managing_director_name populated
- [ ] No data before 2025-01-01 in postings/documents
- [ ] Postings synced for at least 3 active clients
- [ ] SUSA synced for at least 3 clients
- [ ] Documents synced (metadata only, s3_key=NULL)
- [ ] All embeddings generated (embedding IS NOT NULL)
- [ ] Vector search functions work (test with sample query)
- [ ] Metadata filtering works (filter by client_id, year, account)
- [ ] Embedding text quality verified (includes denormalized context)

## Troubleshooting

### Issue: "relation does not exist"

- Make sure migration 004 was applied after migrations 001, 002, 003
- Check pgvector extension is enabled

### Issue: "Function match*datev*\* does not exist"

- Migration may have failed partway
- Re-run migration or create functions manually

### Issue: Sync timeout

- Check `block_until_ms` in tRPC config
- Verify per-client batching is working (check logs)
- Reduce concurrent operations if needed

### Issue: No addressee enrichment in clients

- Check addressees table has data first
- Verify natural_person_id / legal_person_id are populated
- Check sync service logs for addressee lookup errors

### Issue: Embeddings not generated

- Check OpenAI or embeddings provider is configured
- Verify `IEmbeddingsProvider` is injected correctly
- Check embedding service logs

## Next Steps - Phase 1.2

After Phase 1.1 is validated:

1. **S3 Document Storage**
   - Add S3 client configuration
   - Upload document files to S3
   - Populate s3_key, s3_url fields
   - Add presigned URL generation

2. **Relationships Table**
   - Create `datev_relationships` table
   - Sync from `/api/master-data/relationships`
   - Enable graph traversal queries

3. **Tax & Analytics Tables**
   - `datev_corp_tax`
   - `datev_trade_tax`
   - `datev_analytics`

4. **Configurable Date Filtering**
   - Make date filter configurable (not hardcoded 2025-01-01)
   - Add backfill option for historical data

## References

- **Plan:** `.cursor/plans/klardaten_rag_phase1.plan.md`
- **TEC-9:** Epic issue tracking overall Klardaten integration
- **TEC-42:** Phase 1 implementation (this issue)
- **TEC-43:** Phase 2 RAG optimization (future)
