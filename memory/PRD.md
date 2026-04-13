# EduForge AI - Product Requirements Document

## Problem Statement
Build a clean, modern web app called "EduForge AI" for teachers, tutors, and educators to instantly generate high-quality teaching materials (worksheets, quizzes, lesson summaries) using AI.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB
- **AI**: Groq API with LLaMA 3.3 70B Versatile
- **Auth**: JWT-based email/password + guest access
- **PDF**: html2pdf.js (client-side generation)

## User Personas
1. **Teacher** - Needs quick worksheet/quiz generation for daily classes
2. **Tutor** - Generates targeted practice materials for students
3. **Independent Educator** - Creates lesson content for online courses

## Core Requirements
- AI Worksheet Generator (10-15 questions, MCQ + short answer)
- AI Quiz Generator (with answer key, difficulty scaling)
- Lesson Summary Generator (key concepts, real-world examples)
- Copy to clipboard + Download as PDF
- JWT auth with guest access (5 free generations)
- Dark futuristic UI (violet/blue theme)
- Sidebar navigation
- Pricing page (Free/Pro tiers)

## What's Been Implemented (April 12, 2026)
- [x] Full backend with Groq AI integration (LLaMA 3.3 70B)
- [x] JWT authentication (register, login, logout, refresh)
- [x] Guest access with usage tracking (5 free generations)
- [x] Admin seeding
- [x] Worksheet, Quiz, Lesson generation endpoints
- [x] Generation history & stats tracking
- [x] Dark futuristic UI with Outfit/IBM Plex Sans fonts
- [x] Sidebar navigation (responsive, mobile sheet)
- [x] Dashboard with stats cards and tool navigation
- [x] All 3 generators with form inputs and AI output display
- [x] Copy to clipboard & Download as PDF
- [x] Pricing page (Free/Pro tiers)
- [x] Auth page (Login/Register/Guest)
- [x] Loading states with shimmer animation
- [x] All tests passing (100%)

## Prioritized Backlog
### P0 (Done)
- All core AI generators
- Auth system
- PDF download
- Copy functionality

### P1 (Next)
- Stripe integration for Pro tier payments
- Generation history page with search/filter
- Custom formatting templates

### P2 (Future)
- Bulk generation (multiple worksheets at once)
- Export to Google Docs/Word
- Collaborative features (share worksheets)
- Student performance tracking
- Custom branding for institutions

## Next Tasks
1. Integrate Stripe for Pro tier subscription payments
2. Build generation history page with full content view
3. Add custom worksheet/quiz templates
4. Implement password reset flow
5. Add usage analytics dashboard
