# 🚀 EduCurate: Hackathon Pitch & Architecture Visuals

This document serves as a visual aid for the team and judges, explaining the system architecture and our approach to building **ContextBridge (EduCurate Resource Discovery)**.

---

## 1. Hackathon Strategy

To meet the judging criteria for **"Trusted, Localised Resources,"** we deliberately avoided building a generic chatbot.
Instead, we focused on building a **robust, verifiable pipeline** that aggregates fragmented resources (Ingestion), rigorously tests them via AI (Verification), and shapes them exactly to a teacher's unique classroom environment (Adaptation).

* **The Problem:** Widespread resource fragmentation ↔ Extreme time poverty ↔ Untrustworthy generic AI outputs.
* **Our Solution:** A Multi-Agent automated pipeline doing the heavy lifting: **"Discover → Red-Team Verification → Contextual Adaptation"**.

---

## 2. Core Product Features (Teacher's View)

To save teachers time, we built a seamless, tabbed interface where they don't have to write complex AI prompts.

1. **Global Classroom Context (Set it & Forget it):** Teachers define their classroom profile once (e.g., "Year 8, rural demographics, low reading comprehension"). This context automatically applies to all future actions.
2. **Unified Discovery Hub:**
   * **Internal Library:** Search vetted, proprietary resources from our database.
   * **Web Explorer:** Search the live web (Brave/DDG) and YouTube for fresh content.
   * **Personal Studio:** Drag-and-drop legacy teacher PDFs and docs.
3. **One-Click Adaptation:** Instantly rewrite any found resource to match the Classroom Context—simplifying vocabulary, changing cultural references, or adding scaffolding.
4. **Trust Badges (EdGuard Evaluated):** Every adapted resource displays clear "Verified" UI badges, proving it passed PII stripping, hallucination checks, and curriculum standards.

---

## 3. System Architecture & Data Flow

This Sequence Diagram demonstrates the teacher's journey from searching for a resource to securely receiving a verified, localized lesson plan.

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant NextJS as Frontend (Next.js)
    participant FastAPI as Backend (FastAPI)
    participant DB as Supabase/Upstash/B2
    participant RAG as RAG Pipeline
    participant Localiser as Localiser Agent 
    participant Verifier as Verification Agents

    Teacher->>NextJS: 1. Set Classroom Profile (Jotai)
    Teacher->>NextJS: 2. Input (Search / Upload PDF)
    NextJS->>FastAPI: 3. POST /api/v1/resources (with Profile)
    
    alt Ingestion Source
        FastAPI->>DB: Query Internal PGVector
    else Web Search
        FastAPI->>FastAPI: Brave / DDG API / YouTube
    else Upload
        FastAPI->>DB: Store Raw File to Backblaze B2
    end

    FastAPI->>RAG: 4. Normalize raw text & PII Scrub
    RAG->>Localiser: 5. Pass text + Classroom Profile
    Note right of Localiser: Rewrite & Localize<br/>(Apply local curriculum, interests)
    Localiser->>Verifier: 6. Send adapted content for review
    
    par EdGuard (Adversarial)
        Verifier->>Verifier: Check Fact Hallucinations & PII leaks
    and Referencing (Curriculum)
        Verifier->>Verifier: Cross-check against Curriculum Standards
    end
    
    alt Verification Failed
        Verifier-->>Localiser: Reject! Rewrite focusing on safety
        Localiser->>Verifier: Resubmit
    end
    
    Verifier-->>FastAPI: 7. Return Evaluated Safe Resource
    FastAPI-->>NextJS: 8. Stream JSON (AdaptedResourceResponse)
    NextJS->>Teacher: 9. Display Adapted UI & Safety Badges
```

---

## 4. Core Component Diagram

This graph explains how our production infrastructure natively connects to our UI interfaces and Verification AI logic.

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#fff,stroke-width:2px,color:#fff;
    classDef db fill:#8b5cf6,stroke:#fff,stroke-width:2px,color:#fff;
    classDef ai fill:#f59e0b,stroke:#fff,stroke-width:2px,color:#fff;

    subgraph Client [Teacher Workflow UI]
        CP[Classroom Profile State]:::frontend
        L[Library Menu]:::frontend
        W[Web Explore Menu]:::frontend
        S[Studio Upload Menu]:::frontend
    end

    subgraph API [FastAPI Core Layer]
        IR[Ingestion Routers]:::backend
        PII[PII Scrubber]:::backend
        Auth[JWE Auth Middleware]:::backend
    end

    subgraph AI Pipeline [Multi-Agent RAG System]
        RAG[RAG Index/Embed]:::ai
        LA[Localiser Agent]:::ai
        AA[Adversarial EdGuard]:::ai
        RA[Referencing Agent]:::ai
    end

    subgraph Infrastructure [Data & Cache]
        PG[(Supabase PGVector)]:::db
        UR[(Upstash Redis)]:::db
        B2[(Backblaze B2)]:::db
    end

    L & W & S -->|Bearer Token & Profile| Auth
    Auth --> IR
    CP -.-> IR
    
    IR -->|Web APIs| W
    IR -->|Store Uploads| B2
    IR -.-> UR
    IR --> PII
    
    PII --> RAG
    RAG -->|Vector Search| PG
    RAG --> LA
    
    LA -->|Draft Localised Content| AA
    LA -->|Draft Localised Content| RA
    
    AA & RA -->|Safety & Score Metrics| IR
```

---

## 5. Pitch Script Guide for Team Leaders

When showing these diagrams up on the screen, use these talking points to clearly communicate the value payload:

> 1. **The Unified Experience (Frontend):** "Teachers set their unique 'Classroom Context' (e.g., Year 8, rural demographics, specific learning hurdles) precisely once. Whether they're exploring our proprietary database, running a live web search, or dragging in a local PDF, the file goes through the exact same adaptation pipeline."
> 2. **Built on Trust & Security (Backend):** "For educational use, privacy is non-negotiable. Before any prompt even touches the core LLMs, the student data passes through an automated PII (Personally Identifiable Information) masking shield."
> 3. **The Adversarial AI Pipeline (The Secret Sauce):** "We don't just blindly trust what the AI adapts. We implemented a 'Red-Teaming' architecture. The **EdGuard Agent** (acting as a safety and bias evaluator) and the **Referencing Agent** rigorously cross-examine the newly generated content. If it fails curriculum alignment or hallucinates contexts, they reject it automatically. Our teachers only receive the finalized, perfectly-adapted outcomes flanked by green safety badges."
