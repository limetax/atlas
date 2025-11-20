# limetaxIQ - Prototype Implementation Plan

## Tech Stack (Finalized)

### Frontend

- **Framework:** Next.js 14 (App Router)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS with custom lime theme
- **State Management:** React hooks (no external state management)
- **Architecture:** Modified Atomic Design
  - **Elements**: buttons, inputs, badges, icons (formerly atoms)
  - **Components**: chat message, prompt card, file upload (formerly molecules)
  - **Views**: chat interface, sidebar, header (formerly organisms)

### Backend

- **API Layer:** Next.js API Routes (`/app/api`) - handles HTTP requests
- **Service Layer:** Business logic, chat orchestration
- **Adapter Layer:** LLM adapter (abstraction for flexibility)
- **Infrastructure Layer:** Anthropic client, RAG system
- **LLM:** Anthropic Claude 4 Sonnet
- **RAG:** Simple vector search with German tax law documents
- **No Database:** localStorage for chat history, in-memory for RAG

### Communication

- **Frontend ↔ Backend:** Server-Sent Events (SSE) for streaming
- **API Route:** POST `/api/chat` with streaming response
- **Format:** JSON messages over SSE

### Deployment

- **Platform:** Vercel
- **Environment:** `.env.local` for `ANTHROPIC_API_KEY`

---

## Project Structure

```
/limetax-iq
├── /app
│   ├── /api
│   │   └── /chat
│   │       └── route.ts              # POST endpoint with SSE streaming
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Main chat page
│   └── globals.css                   # Global styles + Tailwind
├── /components
│   ├── /elements                     # Atomic elements
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   └── Avatar.tsx
│   ├── /components                   # Composed components
│   │   ├── ChatMessage.tsx
│   │   ├── PromptCard.tsx
│   │   ├── FileUpload.tsx
│   │   └── ComplianceBadge.tsx
│   └── /views                        # Complex views
│       ├── ChatInterface.tsx
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── SystemPromptPanel.tsx
├── /lib
│   ├── /infrastructure               # External integrations
│   │   ├── anthropic.client.ts       # Anthropic SDK wrapper
│   │   └── rag.engine.ts             # Simple RAG with embeddings
│   ├── /adapters                     # Abstraction layer
│   │   └── llm.adapter.ts            # LLM adapter interface
│   ├── /services                     # Business logic
│   │   ├── chat.service.ts           # Chat orchestration
│   │   └── rag.service.ts            # RAG query service
│   └── /utils
│       ├── prompts.ts                # System prompts (German)
│       ├── mock-data.ts              # Mock Mandanten data
│       └── tax-documents.ts          # Sample tax law excerpts
├── /types
│   └── index.ts                      # TypeScript types
├── .env.local                        # ANTHROPIC_API_KEY (gitignored)
├── .env.example                      # Template for env vars
└── package.json
```

---

## Implementation Steps (Optimized)

### **Phase 1: Project Setup** (10 min)

**Goal:** Get Next.js running with dependencies

1. Initialize Next.js 14 with TypeScript and App Router
2. Install dependencies:
   - `@anthropic-ai/sdk`
   - `shadcn/ui` components
   - `tailwindcss`
3. Configure Tailwind with lime theme from `design.json`
4. Create folder structure
5. Set up `.env.example` and `.env.local`

**Deliverable:** Empty Next.js app with structure

---

### **Phase 2: Design System & Rough UI** (25 min)

**Goal:** Get the visual interface working (no backend yet)

6. Configure `globals.css` with design tokens
7. Create **Elements**:
   - `Button.tsx` (primary, secondary, accent variants)
   - `Badge.tsx` (status badges)
   - `Input.tsx` (chat input)
   - `Avatar.tsx`
8. Create **Components**:
   - `ChatMessage.tsx` (user/assistant messages with citations)
   - `PromptCard.tsx` (predefined prompt buttons)
   - `FileUpload.tsx` (fake UI only)
   - `ComplianceBadge.tsx` (GDPR badge)
9. Create **Views**:
   - `Sidebar.tsx` (chat history list - reads from localStorage)
   - `Header.tsx` (logo, compliance badge)
   - `ChatInterface.tsx` (main chat area)
   - `SystemPromptPanel.tsx` (collapsible panel)
10. Wire up `app/page.tsx` with mock data (no API calls yet)

**Deliverable:** Fully functional UI with mock responses

---

### **Phase 3: Infrastructure Layer** (20 min)

**Goal:** Set up external integrations (Anthropic, RAG)

11. Create `anthropic.client.ts`:
    - Initialize SDK with API key from env
    - Streaming message method
12. Create `rag.engine.ts`:
    - Load sample German tax law documents (AO excerpts from gesetze-im-internet.de)
    - Simple keyword/semantic search (no vector DB, just in-memory)
    - Return relevant paragraphs with citations
13. Create `tax-documents.ts`:
    - Extract ~10 key paragraphs from Abgabenordnung (AO)
    - Store as JSON with `{ id, title, content, citation }`
14. Create `mock-data.ts`:
    - Sample Mandanten (clients) with deadlines
    - This is the "Client RAG" data

**Deliverable:** Working Anthropic client + simple RAG engine

---

### **Phase 4: Adapter Layer** (10 min)

**Goal:** Abstract LLM provider for flexibility

15. Create `llm.adapter.ts`:
    - Define `ILLMAdapter` interface:
      ```typescript
      interface ILLMAdapter {
        streamChat(
          messages: Message[],
          systemPrompt: string
        ): AsyncIterator<string>;
        generateEmbedding(text: string): Promise<number[]>;
      }
      ```
    - Implement `AnthropicAdapter` using `anthropic.client.ts`
    - Export singleton instance

**Deliverable:** Provider-agnostic LLM interface

---

### **Phase 5: Service Layer** (15 min)

**Goal:** Business logic and orchestration

16. Create `rag.service.ts`:
    - `searchTaxLaw(query: string)`: searches tax documents
    - `searchMandanten(query: string)`: searches mock client data
    - Returns relevant context with citations
17. Create `chat.service.ts`:
    - `processMessage(userMessage: string, history: Message[])`:
      - Calls RAG service to get context
      - Builds system prompt with context
      - Calls LLM adapter with streaming
      - Returns async iterator with citations

**Deliverable:** Complete business logic layer

---

### **Phase 6: API Layer** (15 min)

**Goal:** Expose backend via HTTP

18. Create `app/api/chat/route.ts`:
    - POST handler accepting `{ message: string, history: Message[] }`
    - Calls `chat.service.processMessage()`
    - Streams response using Server-Sent Events (SSE)
    - Returns chunks: `data: {"type": "text", "content": "..."}\n\n`
    - Returns citations: `data: {"type": "citation", "source": "§ 1 AO"}\n\n`
19. Add error handling and validation

**Deliverable:** Working streaming API endpoint

---

### **Phase 7: Frontend Integration** (15 min)

**Goal:** Connect UI to real backend

20. Update `ChatInterface.tsx`:
    - Replace mock data with real API calls
    - Implement SSE client using `fetch()` + `ReadableStream`
    - Handle streaming text chunks
    - Display citations as badges
    - Save chat history to localStorage
21. Update `Sidebar.tsx`:
    - Load chat sessions from localStorage
    - Create new chat functionality
22. Update `SystemPromptPanel.tsx`:
    - Fetch and display actual system prompt
    - Show connected data sources (AO, Mandanten DB)

**Deliverable:** Fully integrated application

---

### **Phase 8: Polish & Deploy** (10 min)

**Goal:** Production-ready prototype

23. Add loading states and error handling
24. Test all predefined prompts
25. Add README with setup instructions
26. Deploy to Vercel:
    - Connect GitHub repo
    - Add `ANTHROPIC_API_KEY` to Vercel env vars
    - Deploy
27. Test deployed version

**Deliverable:** Live prototype on Vercel

---

## Total Estimated Time: ~2 hours

---

## Core Features

### 1. Chat Interface (German)

- ✅ Streaming responses with typing indicator
- ✅ Message history (localStorage)
- ✅ Citation badges from RAG
- ✅ File upload UI (visual only, no processing)

### 2. Predefined Prompts (German)

- "📋 Zusammenfassung offener Fristen für alle Mandanten"
- "⚖️ Steuerliche Einordnung eines Sachverhalts"
- "📊 Mandantenvorbereitung für [Mandant]"
- "📈 Vergleich Bearbeitungszeiten (anonymisiert)"

### 3. RAG System

- **Tax Law RAG**: Abgabenordnung (AO) excerpts from gesetze-im-internet.de
- **Client RAG**: Mock Mandanten data with deadlines
- Simple keyword + semantic matching (no vector DB)
- Citations displayed as badges

### 4. System Prompt Panel

- Toggle to show/hide
- Display current system prompt (German)
- Show connected data sources:
  - ✅ Abgabenordnung (AO)
  - ✅ Mandanten-Datenbank
  - ✅ EStG, UStG (mock references)

### 5. Compliance Badge

- Fixed header badge: "🇩🇪 Hosted in Germany | DSGVO-konform"

---

## System Prompt (German)

```
Du bist limetaxIQ, ein KI-Assistent für deutsche Steuerberater und Steuerkanzleien.

Deine Aufgaben:
- Beantworte steuerrechtliche Fragen präzise und mit Quellenangaben
- Unterstütze bei der Mandantenvorbereitung und Fristenverwaltung
- Erkläre komplexe Sachverhalte verständlich für Steuerberater
- Gib IMMER Quellen an (z.B. § 1 AO, § 15 EStG)

Verfügbare Datenquellen:
{RAG_CONTEXT}

Antworte immer auf Deutsch, professionell und präzise.
Bei Unsicherheit: Weise auf Interpretationsspielräume hin.
```

---

## Communication Protocol (Frontend ↔ Backend)

### Request (POST /api/chat)

```json
{
  "message": "Was besagt § 42 AO?",
  "history": [
    { "role": "user", "content": "Hallo" },
    { "role": "assistant", "content": "Guten Tag!" }
  ]
}
```

### Response (Server-Sent Events)

```
data: {"type":"text","content":"Gemäß "}

data: {"type":"text","content":"§ 42 AO"}

data: {"type":"citation","source":"§ 42 AO","title":"Abgabenordnung"}

data: {"type":"text","content":" gilt..."}

data: {"type":"done"}
```

---

## Sample Tax Documents (RAG)

We'll extract ~10 key paragraphs from:

- https://www.gesetze-im-internet.de/ao_1977/
- Focus on: § 1 (Anwendungsbereich), § 38 (Steuerschuldner), § 42 (Entstehung), etc.

Format:

```typescript
{
  id: "ao_1",
  citation: "§ 1 AO",
  title: "Anwendungsbereich",
  content: "Die Abgabenordnung gilt für alle Steuern..."
}
```

---

## Mock Client Data (Mandanten RAG)

```typescript
[
  {
    id: "m1",
    name: "Müller GmbH",
    type: "GmbH",
    deadlines: [{ date: "2025-01-10", task: "USt-Voranmeldung Dezember 2024" }],
  },
  {
    id: "m2",
    name: "Schmidt Consulting",
    type: "Freiberufler",
    deadlines: [{ date: "2025-02-15", task: "ESt-Erklärung 2023" }],
  },
];
```

---

## Environment Variables

```bash
# .env.local (DO NOT COMMIT)
ANTHROPIC_API_KEY=sk-ant-...

# .env.example (commit this)
ANTHROPIC_API_KEY=your_key_here
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@anthropic-ai/sdk": "^0.17.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## Next Steps

Ready to start building! Shall I:

1. **Generate the complete codebase** following this plan?
2. **Start with Phase 1** and proceed step-by-step?

Let me know and I'll begin implementation! 🚀
