# AI Assistant for Tax Advisory Firms

An intelligent chat assistant for German tax advisors powered by Claude Sonnet 4, RAG system, and real-time source citations.

## 🎯 What Makes It Special?

**Problem:** Tax advisors waste hours daily researching laws and client documents.

**Solution:** AI assistant with RAG (Retrieval-Augmented Generation) that:

- Answers tax law questions **with source citations**
- Automatically summarizes client deadlines
- **Inline links** paragraphs to gesetze-im-internet.de
- **Streams in real-time** for instant feedback

## 🚀 Technical Highlights

### Clean Architecture

```
Frontend (Next.js 16) → API Layer → Service Layer → Adapter Layer → Infrastructure
```

**Why Adapter Pattern?** LLM-provider agnostic – switch from Claude to GPT-4 in one line of code.

### RAG System

- **16 Tax Laws** (AO, UStG) with automatic paragraph recognition
- **Inline Citations** – every legal statement has clickable source
- **Mock Client Database** with deadlines and priorities
- **Keyword + Semantic Search** (Production: Vector DB)

### Tech Stack

- **Next.js 16** (App Router, SSR, Streaming)
- **Claude Sonnet 4** (200k context, best German language support)
- **TypeScript** (Type Safety)
- **Tailwind CSS 4** (Custom Design System)
- **Server-Sent Events** (Real-time streaming)

## ⚡ Quick Start

```bash
# 1. Install
pnpm install

# 2. Add API Key
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env.local

# 3. Run
pnpm run dev
```

---

Made with 🍋
