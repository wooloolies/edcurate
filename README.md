# Edcurate

> [EduX Challenge 4: AI-Powered Video Generation for Education Equality](https://cambridge-edtech-society.org/edux/edux-challenge-4.html)

Democratising access to high-quality educational content through contextually aware AI video systems.

## Problem

Learners in under-resourced schools, rural communities, and low-bandwidth environments lack rich multimedia instruction. AI-powered video generation offers democratization potential — but only if content is accurate, culturally relevant, pedagogically sound, and technically accessible across diverse devices and connectivity conditions.

## Challenge

> How might we design an AI-powered video generation system that produces accurate, engaging, and contextually appropriate educational content to support learners in resource-scarce environments?

## Target Users

- Learners in low-resource and rural educational settings
- Teachers with limited access to professional development materials
- NGOs and government bodies working on educational equity
- EdTech developers targeting emerging markets

## Key Design Principles

- **Content Accuracy** — Generated videos must be factually correct and reviewed against authoritative curriculum sources
- **Cultural Relevance** — Adapt to local contexts, languages, and cultural norms rather than defaulting to Western or high-income country assumptions
- **Accessibility** — Design for low-bandwidth environments, low-spec devices, and learners with sensory or cognitive differences
- **Sustainability** — Maintainable, updatable, and scalable without requiring significant ongoing technical infrastructure

## Judging Criteria

> Oceania EduX 2026 — each criterion scored out of 10

| Criteria | What Judges Look For |
|---|---|
| **Human-centred Application & Challenge Relevance** | Clarity of the real user problem being solved; depth of understanding of target users and context; strong alignment with the set challenge. Demonstrates appropriate educational/psychological theories and shows how they are concretely translated into product or intervention design. |
| **Technological Implementation & Feasibility** | Soundness of the technical approach and architecture; effective use of AI/tech to enable the proposed solution. Evidence that the prototype works (or is convincingly achievable) within realistic constraints of data, time, and resources. |
| **Responsible AI & Ethics** | Proactive consideration of fairness, privacy, safety, transparency, and accountability. Identifies potential risks (e.g., bias, misuse, harm to vulnerable users) and includes credible mitigation strategies and governance practices. |
| **Creativity & Innovation** | Originality of the idea and/or novel recombination of existing approaches; clear value added beyond standard or expected solutions, with attention to meaningful impact in real educational settings. |

## Deliverables

1. A working prototype generating at least one educational video segment for a specific subject and target learner context
2. A 5-minute video and pitch deck explaining how equity, accuracy, and accessibility are prioritised in the system design

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js, React, TailwindCSS, shadcn/ui |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL, Redis |
| **Infrastructure** | Terraform, GCP (Cloud Run, Cloud SQL, Cloud Storage) |

## Getting Started

### Prerequisites

- [mise](https://mise.jdx.dev/) — Runtime version manager
- [Docker](https://www.docker.com/) or [Podman Desktop](https://podman-desktop.io/downloads) — Local infrastructure

### Setup

```bash
# Install runtimes
mise install

# Install dependencies
mise run install

# Start local infrastructure (PostgreSQL, Redis, MinIO)
mise infra:up

# Run database migrations
mise db:migrate

# Start development servers
mise dev:web
```

## License

AGPL-3.0 — see [LICENSE](./LICENSE) for details.
