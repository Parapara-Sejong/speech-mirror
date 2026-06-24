# Pricing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a UI-only pricing page that shows Speech Mirror's monetization structure.

**Architecture:** Create one page component and register it in the existing React Router setup. Reuse showcase components and existing pricing constants instead of adding new abstractions.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, react-router-dom.

---

### Task 1: Pricing Page

**Files:**

- Create: `frontend/src/pages/PricingPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `PricingPage.tsx`**

Use `HeroBand`, `PricingTierCard`, `CtaBand`, `Footer`, `Button`, and `PRICING_TIERS`.

- [ ] **Step 2: Register route and nav**

Import `PricingPage`, add a `/pricing` route, and add a `Pricing` nav link.

- [ ] **Step 3: Verify**

Run: `npm run build`

Expected: TypeScript and Vite build pass.
