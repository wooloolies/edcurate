# Indepth Search for Teaching Resources for Localised, Real Classroom Contexts

**Trusted and Context-Aware Resource Discovery for Teaching**

Challenge brief: https://cambridge-edtech-society.org/edux/edux-challenge-4.html

---

## Problem Overview

Teachers today operate in an environment of overwhelming resource abundance but limited time. Curriculum authorities and education publishers do their best to cater for teacher and student needs of a particular time and region, however they don’t always get it right. While vast amounts of educational sources and content are available online, much of it is not directly aligned with curriculum requirements, student interest, or local classroom contexts.

In practice, teachers spend significant time:

- Searching across fragmented platforms and websites
- Evaluating the quality and appropriateness of materials
- Adapting resources to suit different learner levels, backgrounds, and learning goals

Authors, publishers and curriculum authorities do much of the same, collating and crafting relevant resources, attempting to save teachers some of their precious time. For both parties, this process is often inefficient, inconsistent, and cognitively demanding. Existing tools frequently provide generic outputs that lack contextual relevance, requiring further modification and verification.

Additionally, concerns around accuracy, bias, safety, intellectual property, and trustworthiness of online and AI-generated content create an added layer of responsibility.

This challenge focuses on reducing these burdens while supporting teachers, authors and curriculum writers in making informed, context-sensitive decisions.

## Challenge Statement

Design and create a teacher-facing solution that helps educators find, evaluate, and adapt safe, high-quality online resources tailored to their localised context and needs, while ensuring trust, reliability, and transparency.

## Target Users

The primary users are educators across diverse contexts, including but not limited to:

- 7–12 teachers
- Education publishers and authors
- Language and subject specialists
- Curriculum designers
- Instructional coaches and education professionals

Educators may work in a wide range of settings, such as public and private schools, international and bilingual programmes, higher education institutions, and informal or online learning environments.

## Scope & Focus

Solutions should focus on teacher-facing workflows for years 7-12 and may address one or more of the following:

- Resource discovery and filtering
- Adjustment of scope (e.g., country, state, town, class, individual)
- Quality evaluation and verification (e.g., alignment, bias, safety)
- Contextual adaptation (e.g., curriculum, regional, modern-day and cultural relevance, student interests)
- Integration of multiple data sources (e.g., curriculum standards, classroom data, local organisations, government, history or media)
- Transparency of intellectual property and source referencing
- Supporting and informing teacher decision-making rather than replacing it

Participants are encouraged to design solutions that are:

- Practical and usable for real classroom settings
- Sensitive to diverse educational contexts (local, cultural, linguistic)
- Aligned with ethical and responsible use of technology

## About Cambridge University Press & Assessment

Cambridge University Press & Assessment is part of the University of Cambridge and is a global organisation dedicated to advancing learning, knowledge, and research. It provides educational resources, assessments, and qualifications used by learners and educators worldwide.

With a strong focus on quality, academic rigour, and global relevance, Cambridge supports educators through curriculum-aligned materials, research-informed frameworks, and assessment systems that promote meaningful learning outcomes.

This challenge aligns with Cambridge’s mission to support teachers with trusted, high-quality educational resources and to explore how emerging technologies can enhance teaching and learning in real-world contexts.

## Key Elements to Consider

Your solution should support educators in real classroom workflows, including:

- **Planning and resource discovery:** identifying relevant, high-quality materials across fragmented sources
- **Contextual adaptation and personalisation:** e.g., adjusting for learner level, location, language background, student interests, and scope from country → individual
- **Curriculum alignment and structured output:** ensuring materials align with standards and are presented in clear, engaging, and usable formats
- **Quality, safety, and trust evaluation:** assessing accuracy, bias, appropriateness, and ensuring proper citation and intellectual property transparency
- **Localisation and contextual relevance:** e.g., integrating local data, geography, history, First Nations perspectives, communities, and cultural references
- **Data-informed teaching decisions:** e.g., interpreting student performance or contextual data to guide adaptation

Solutions should also account for:

- limited time and high workload
- varying levels of digital and AI literacy
- the need for practical, ready-to-use outputs
- maintaining teacher judgement and professional agency
- transparent and traceable sources

> [!TIP]
> **For inspiration only:**
>
> Solutions may combine context-aware resource discovery, localisation, and evaluation, for example by:
>
> - embedding and selecting your contextualised localised content (e.g., statistics, maps, history, First Nations knowledge, community projects, cultural figures such as local sports teams, artists, or music)
> - enabling smarter filtering, ranking, and contextualisation of resources (creating your search engine)
> - supporting evaluation of quality, bias, and safety
> - allowing teachers to input, store, and reuse classroom context to continuously refine outputs

## Desired Outcomes

- A working prototype demonstrating the product or experience design (to be presented on Demo Day)
- A pitch deck and 2–3-minute video explaining the concept and user experience and how the design addresses the challenge

## Getting Started

### Prerequisites

- [mise](https://mise.jdx.dev/) — Runtime version manager (`brew install mise`)
- [Docker](https://www.docker.com/), [OrbStack](https://orbstack.dev/), or [Podman Desktop](https://podman-desktop.io/downloads) — Local infrastructure

### Setup

```bash
# Trust mise config (required on first clone)
mise trust

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

## Auth and Email Delivery

- Email/password sign-up and login are handled by `apps/api`.
- `apps/web` no longer sends emails through Resend directly.
- `apps/web` still hosts `better-auth` routes for session and OAuth exchange only.

### Production Vercel env

`apps/web`

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`

`apps/api`

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `JWE_SECRET_KEY`
- `PROJECT_ENV`
- `RESEND_API_KEY` when verification emails are enabled
- `EMAIL_FROM` when `RESEND_API_KEY` is set
