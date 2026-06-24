# DESIGN.md 디자인 시스템 컴포넌트 + Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DESIGN.md(cream + coral + dark navy)를 Tailwind v4 토큰으로 박고, 재사용 UI 컴포넌트 세트와 이를 검수하는 `/showcase` 갤러리 페이지를 추가한다.

**Architecture:** `styles.css`의 `@theme`에 DESIGN.md 색·타이포·radius·spacing·폰트 토큰을 정의해 전역 유틸(`bg-canvas`·`text-display-xl`·`rounded-lg`)을 생성한다. 작은 단일 책임 컴포넌트(`components/ui/*`, `components/sections/*`)를 만들고, `react-router-dom`으로 `/`(기존 analysis 데모)와 `/showcase`(갤러리)를 분리한다.

**Tech Stack:** React 19, Vite 8, TypeScript(strict, Bundler resolution), Tailwind CSS v4, react-router-dom, Pretendard + JetBrains Mono.

> **해커톤 모드: 자동 테스트 없음.** vitest 등 테스트 도구는 도입하지 않는다. 각 태스크 검증은 `npm run build`(tsc 타입체크 + vite 빌드) 통과 + 최종 `/showcase` 육안 확인으로 한다.

## Global Constraints

- 패키지 매니저는 **npm**.
- 색·radius·타이포·spacing은 **Tailwind v4 `@theme` 토큰 유틸만** 사용한다(`bg-canvas`, `text-ink`, `rounded-lg`, `text-display-xl`, `py-section`). hex 인라인 금지 — 단, 토큰을 **정의**하는 `src/styles.css`의 `@theme` 블록은 예외.
- 폰트는 **Pretendard(sans+display 통일) + JetBrains Mono(code)**. `index.html`에서 외부 `<link>`로 로드. serif 미사용(한글 커버리지).
- UI 노출 텍스트는 **한국어**.
- JSX 조건부 렌더는 **삼항(`cond ? <X/> : null`)**, `{cond && <X/>}` 금지(falsy 방어). `cn()` 내부 className 조합은 삼항/`&&` 허용.
- 컴포넌트는 **1파일 1컴포넌트, named export**.
- **자동 테스트 없음** — 검증은 `npm run build` + showcase 육안.
- 커밋 메시지 형식 `<type> : <설명> #<issue>`. `<issue>` = 이 작업의 GitHub 이슈 번호 — **실행 첫 커밋 전 사용자에게 확인**해 모든 커밋에 동일 번호 사용(없으면 태그 생략). 커밋은 **사용자가 실행을 승인한 뒤에만**. **Co-Authored-By 태그 금지.**

---

### Task 1: 디자인 토큰·폰트·cn 유틸·라우터 의존성

**Files:**
- Modify: `package.json` (react-router-dom 의존성)
- Modify: `src/styles.css` (@theme 토큰)
- Modify: `index.html` (폰트 link)
- Create: `src/lib/cn.ts`

**Interfaces:**
- Produces: `cn(...classes: Array<string | false | null | undefined>): string` — 진실값 클래스만 공백으로 합침. 모든 컴포넌트가 사용.
- Produces: Tailwind 토큰 유틸 — 색(`bg-canvas`·`bg-primary`·`bg-surface-dark`·`text-ink`·`text-on-dark`·`text-muted`·`border-hairline`·`text-on-primary` 등), 타이포(`text-display-xl`~`text-nav-link`), radius(`rounded-xs/sm/md/lg/xl`), spacing(`*-section`=96px), 폰트(`font-sans`·`font-display`·`font-mono`).

- [ ] **Step 1: 의존성 설치**

```bash
cd frontend
npm install react-router-dom
```

- [ ] **Step 2: `src/styles.css`를 토큰 정의로 교체**

```css
@import 'tailwindcss';

@theme {
  /* fonts */
  --font-sans:
    'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui,
    'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  --font-display:
    'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui,
    'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  /* colors — brand */
  --color-primary: #cc785c;
  --color-primary-active: #a9583e;
  --color-primary-disabled: #e6dfd8;
  --color-accent-teal: #5db8a6;
  --color-accent-amber: #e8a55a;

  /* colors — surface */
  --color-canvas: #faf9f5;
  --color-surface-soft: #f5f0e8;
  --color-surface-card: #efe9de;
  --color-surface-cream-strong: #e8e0d2;
  --color-surface-dark: #181715;
  --color-surface-dark-elevated: #252320;
  --color-surface-dark-soft: #1f1e1b;
  --color-hairline: #e6dfd8;
  --color-hairline-soft: #ebe6df;

  /* colors — text */
  --color-ink: #141413;
  --color-body-strong: #252523;
  --color-body: #3d3d3a;
  --color-muted: #6c6a64;
  --color-muted-soft: #8e8b82;
  --color-on-primary: #ffffff;
  --color-on-dark: #faf9f5;
  --color-on-dark-soft: #a09d96;

  /* colors — semantic */
  --color-success: #5db872;
  --color-warning: #d4a017;
  --color-error: #c64545;

  /* typography */
  --text-display-xl: 64px;
  --text-display-xl--line-height: 1.05;
  --text-display-xl--letter-spacing: -1.5px;
  --text-display-lg: 48px;
  --text-display-lg--line-height: 1.1;
  --text-display-lg--letter-spacing: -1px;
  --text-display-md: 36px;
  --text-display-md--line-height: 1.15;
  --text-display-md--letter-spacing: -0.5px;
  --text-display-sm: 28px;
  --text-display-sm--line-height: 1.2;
  --text-display-sm--letter-spacing: -0.3px;
  --text-title-lg: 22px;
  --text-title-lg--line-height: 1.3;
  --text-title-md: 18px;
  --text-title-md--line-height: 1.4;
  --text-title-sm: 16px;
  --text-title-sm--line-height: 1.4;
  --text-body-md: 16px;
  --text-body-md--line-height: 1.55;
  --text-body-sm: 14px;
  --text-body-sm--line-height: 1.55;
  --text-caption: 13px;
  --text-caption--line-height: 1.4;
  --text-caption-uppercase: 12px;
  --text-caption-uppercase--line-height: 1.4;
  --text-caption-uppercase--letter-spacing: 1.5px;
  --text-code: 14px;
  --text-code--line-height: 1.6;
  --text-button: 14px;
  --text-button--line-height: 1;
  --text-nav-link: 14px;
  --text-nav-link--line-height: 1.4;

  /* radius — DESIGN.md 값으로 Tailwind 기본 override */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* spacing — 의미 토큰 */
  --spacing-section: 96px;
}

body {
  min-height: 100vh;
}
```

- [ ] **Step 3: `index.html` `<head>`에 폰트 로드 추가**

`<meta name="viewport" ... />` 다음 줄에 삽입:
```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable-dynamic-subset.css"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap"
    />
```

- [ ] **Step 4: `src/lib/cn.ts` 구현**

```ts
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 타입체크 + 빌드 성공(에러 0)

- [ ] **Step 6: 커밋**

```bash
git add package.json package-lock.json index.html src/styles.css src/lib/cn.ts
git commit -m "feat : 디자인 토큰·폰트·cn 유틸·라우터 의존성 추가 #<issue>"
```

---

### Task 2: Button · IconButton

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/IconButton.tsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/cn.ts`.
- Produces: `Button({ variant?: 'primary'|'secondary'|'secondary-on-dark'|'text-link' } & ButtonHTMLAttributes)`; `IconButton(ButtonHTMLAttributes)` — 원형 36px. 이후 카드/섹션/showcase에서 사용.

- [ ] **Step 1: `src/components/ui/Button.tsx` 구현**

```tsx
import { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'secondary-on-dark' | 'text-link';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'h-10 px-5 rounded-md bg-primary text-on-primary active:bg-primary-active disabled:bg-primary-disabled',
  secondary: 'h-10 px-5 rounded-md bg-canvas text-ink border border-hairline',
  'secondary-on-dark': 'h-10 px-5 rounded-md bg-surface-dark-elevated text-on-dark',
  'text-link': 'text-primary underline-offset-4 active:underline',
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn('inline-flex items-center justify-center text-button font-medium', VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}
```

- [ ] **Step 2: `src/components/ui/IconButton.tsx` 구현**

```tsx
import { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-canvas text-ink',
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 3: 빌드 확인 + 커밋**

Run: `npm run build`
Expected: 성공
```bash
git add src/components/ui/Button.tsx src/components/ui/IconButton.tsx
git commit -m "feat : Button·IconButton 컴포넌트 추가 #<issue>"
```

---

### Task 3: Badge · CategoryTab · TextInput

**Files:**
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/CategoryTab.tsx`
- Create: `src/components/ui/TextInput.tsx`

**Interfaces:**
- Consumes: `cn`.
- Produces: `Badge({ variant?: 'pill'|'coral' } & HTMLAttributes<HTMLSpanElement>)`; `CategoryTab({ active?: boolean } & ButtonHTMLAttributes)`; `TextInput(InputHTMLAttributes<HTMLInputElement>)`.

- [ ] **Step 1: `src/components/ui/Badge.tsx` 구현**

```tsx
import { HTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type BadgeVariant = 'pill' | 'coral';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  pill: 'bg-surface-card text-ink text-caption',
  coral: 'bg-primary text-on-primary text-caption-uppercase uppercase',
};

export function Badge({ variant = 'pill', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 font-medium',
        BADGE_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 2: `src/components/ui/CategoryTab.tsx` 구현**

```tsx
import { ButtonHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type CategoryTabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function CategoryTab({ active = false, className, ...props }: CategoryTabProps) {
  return (
    <button
      className={cn(
        'rounded-md px-3.5 py-2 text-nav-link font-medium',
        active ? 'bg-surface-card text-ink' : 'bg-transparent text-muted',
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 3: `src/components/ui/TextInput.tsx` 구현**

```tsx
import { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/cn';

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        'h-10 rounded-md border border-hairline bg-canvas px-3.5 py-2.5 text-body-md text-ink',
        'outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15',
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 4: 빌드 확인 + 커밋**

Run: `npm run build`
Expected: 성공
```bash
git add src/components/ui/Badge.tsx src/components/ui/CategoryTab.tsx src/components/ui/TextInput.tsx
git commit -m "feat : Badge·CategoryTab·TextInput 컴포넌트 추가 #<issue>"
```

---

### Task 4: FeatureCard · ProductMockupCardDark · CalloutCardCoral

**Files:**
- Create: `src/components/ui/FeatureCard.tsx`
- Create: `src/components/ui/ProductMockupCardDark.tsx`
- Create: `src/components/ui/CalloutCardCoral.tsx`

**Interfaces:**
- Consumes: (CalloutCardCoral는 caller가 `action`으로 `Button` 전달).
- Produces: `FeatureCard({ icon?: ReactNode; title: string; children?: ReactNode })`; `ProductMockupCardDark({ title?: string; children?: ReactNode })`; `CalloutCardCoral({ title: string; children?: ReactNode; action?: ReactNode })`.

- [ ] **Step 1: `src/components/ui/FeatureCard.tsx` 구현**

```tsx
import { ReactNode } from 'react';

type FeatureCardProps = {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
};

export function FeatureCard({ icon, title, children }: FeatureCardProps) {
  return (
    <div className="rounded-lg bg-surface-card p-8">
      {icon ? <div className="mb-4 text-primary">{icon}</div> : null}
      <h3 className="text-title-md font-medium text-ink">{title}</h3>
      {children ? <p className="mt-2 text-body-md text-body">{children}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: `src/components/ui/ProductMockupCardDark.tsx` 구현**

```tsx
import { ReactNode } from 'react';

type ProductMockupCardDarkProps = {
  title?: string;
  children?: ReactNode;
};

export function ProductMockupCardDark({ title, children }: ProductMockupCardDarkProps) {
  return (
    <div className="rounded-lg bg-surface-dark p-8 text-on-dark">
      {title ? <p className="text-title-sm font-medium text-on-dark">{title}</p> : null}
      <div className="mt-3 text-body-sm text-on-dark-soft">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/ui/CalloutCardCoral.tsx` 구현**

```tsx
import { ReactNode } from 'react';

type CalloutCardCoralProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export function CalloutCardCoral({ title, children, action }: CalloutCardCoralProps) {
  return (
    <div className="rounded-lg bg-primary p-12 text-on-primary">
      <h3 className="text-display-sm font-semibold">{title}</h3>
      {children ? <p className="mt-3 text-body-md text-on-primary/90">{children}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 4: 빌드 확인 + 커밋**

Run: `npm run build`
Expected: 성공
```bash
git add src/components/ui/FeatureCard.tsx src/components/ui/ProductMockupCardDark.tsx src/components/ui/CalloutCardCoral.tsx
git commit -m "feat : FeatureCard·ProductMockupCardDark·CalloutCardCoral 추가 #<issue>"
```

---

### Task 5: CodeWindowCard

**Files:**
- Create: `src/components/ui/CodeWindowCard.tsx`

**Interfaces:**
- Produces: `CodeWindowCard({ code: string; filename?: string })` — `code`를 줄 단위로 나눠 줄번호와 함께 렌더, 끝의 개행 1개는 무시.

- [ ] **Step 1: `src/components/ui/CodeWindowCard.tsx` 구현**

```tsx
type CodeWindowCardProps = {
  code: string;
  filename?: string;
};

export function CodeWindowCard({ code, filename }: CodeWindowCardProps) {
  // 끝의 개행 1개는 표시상 군더더기라 제거 후 줄 분리
  const lines = code.replace(/\n$/, '').split('\n');

  return (
    <div className="overflow-hidden rounded-lg bg-surface-dark">
      <div className="flex items-center gap-2 border-b border-on-dark/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-on-dark-soft/50" />
        <span className="h-3 w-3 rounded-full bg-on-dark-soft/50" />
        <span className="h-3 w-3 rounded-full bg-on-dark-soft/50" />
        {filename ? <span className="ml-2 text-body-sm text-on-dark-soft">{filename}</span> : null}
      </div>
      <pre className="overflow-x-auto bg-surface-dark-soft p-6 text-code">
        <code className="font-mono text-on-dark">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              <span className="mr-4 w-6 shrink-0 select-none text-right text-on-dark-soft">
                {index + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인 + 커밋**

Run: `npm run build`
Expected: 성공
```bash
git add src/components/ui/CodeWindowCard.tsx
git commit -m "feat : CodeWindowCard 컴포넌트 추가 #<issue>"
```

---

### Task 6: 가격 데이터 + PricingTierCard

**Files:**
- Create: `src/constants/pricing.ts`
- Create: `src/components/ui/PricingTierCard.tsx`

**Interfaces:**
- Consumes: `cn`, `Button`.
- Produces: `type PricingTier = { name: string; price: string; period?: string; features: string[]; featured?: boolean; ctaLabel: string }`; `PRICING_TIERS: PricingTier[]`; `PricingTierCard(props: PricingTier)` — featured=true면 dark surface(`bg-surface-dark`)로 반전.

- [ ] **Step 1: `src/constants/pricing.ts` 작성**

```ts
export type PricingTier = {
  name: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
};

// 더미값 — 실제 가격/기능은 이 파일만 수정한다(calibration 노브)
export const PRICING_TIERS: PricingTier[] = [
  {
    name: '무료',
    price: '₩0',
    period: '/월',
    features: ['월 3회 모의 면접', '기본 피드백', '기록 7일 보관'],
    ctaLabel: '무료로 시작',
  },
  {
    name: '프로',
    price: '₩19,000',
    period: '/월',
    featured: true,
    features: ['무제한 모의 면접', 'AI 상세 피드백', '직무별 질문 세트', '기록 무제한'],
    ctaLabel: '프로 시작하기',
  },
  {
    name: '맥스',
    price: '₩49,000',
    period: '/월',
    features: ['프로 전체 포함', '실시간 음성 면접', '맞춤 커리큘럼', '우선 지원'],
    ctaLabel: '맥스 시작하기',
  },
];
```

- [ ] **Step 2: `src/components/ui/PricingTierCard.tsx` 구현**

```tsx
import { cn } from '../../lib/cn';
import { Button } from './Button';

type PricingTierCardProps = {
  name: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
};

export function PricingTierCard({
  name,
  price,
  period,
  features,
  featured = false,
  ctaLabel,
}: PricingTierCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-lg p-8',
        featured ? 'bg-surface-dark text-on-dark' : 'border border-hairline bg-canvas text-ink',
      )}
    >
      <p className={cn('text-title-lg font-medium', featured ? 'text-on-dark' : 'text-ink')}>
        {name}
      </p>
      <p className="mt-3 text-display-sm font-semibold">
        {price}
        {period ? (
          <span className={cn('text-body-sm font-normal', featured ? 'text-on-dark-soft' : 'text-muted')}>
            {period}
          </span>
        ) : null}
      </p>
      <ul
        className={cn(
          'mt-6 flex flex-col gap-2 text-body-md',
          featured ? 'text-on-dark-soft' : 'text-body',
        )}
      >
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className="mt-8">
        <Button variant={featured ? 'secondary-on-dark' : 'primary'} className="w-full">
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인 + 커밋**

Run: `npm run build`
Expected: 성공
```bash
git add src/constants/pricing.ts src/components/ui/PricingTierCard.tsx
git commit -m "feat : 가격 데이터·PricingTierCard 추가 #<issue>"
```

---

### Task 7: HeroBand · CtaBand · Footer (섹션)

**Files:**
- Create: `src/components/sections/HeroBand.tsx`
- Create: `src/components/sections/CtaBand.tsx`
- Create: `src/components/sections/Footer.tsx`

**Interfaces:**
- Consumes: `cn`.
- Produces: `HeroBand({ eyebrow?, title, subtitle?, actions?, aside? })`; `CtaBand({ variant?: 'coral'|'dark', title, subtitle?, action? })`; `Footer({ columns?: { title: string; links: string[] }[] })`.

- [ ] **Step 1: `src/components/sections/HeroBand.tsx` 구현**

```tsx
import { ReactNode } from 'react';

type HeroBandProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;
};

export function HeroBand({ eyebrow, title, subtitle, actions, aside }: HeroBandProps) {
  return (
    <section className="grid grid-cols-1 items-center gap-12 py-section md:grid-cols-2">
      <div className="flex flex-col gap-5">
        {eyebrow ? (
          <span className="text-caption-uppercase uppercase text-primary">{eyebrow}</span>
        ) : null}
        <h1 className="text-display-xl font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="text-title-md text-body">{subtitle}</p> : null}
        {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {aside ? <div>{aside}</div> : null}
    </section>
  );
}
```

- [ ] **Step 2: `src/components/sections/CtaBand.tsx` 구현**

```tsx
import { ReactNode } from 'react';

import { cn } from '../../lib/cn';

type CtaBandProps = {
  variant?: 'coral' | 'dark';
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function CtaBand({ variant = 'coral', title, subtitle, action }: CtaBandProps) {
  const isCoral = variant === 'coral';

  return (
    <section
      className={cn(
        'rounded-lg p-16 text-center',
        isCoral ? 'bg-primary text-on-primary' : 'bg-surface-dark text-on-dark',
      )}
    >
      <h2 className="text-display-sm font-semibold">{title}</h2>
      {subtitle ? (
        <p
          className={cn(
            'mx-auto mt-3 max-w-xl text-body-md',
            isCoral ? 'text-on-primary/90' : 'text-on-dark-soft',
          )}
        >
          {subtitle}
        </p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </section>
  );
}
```

- [ ] **Step 3: `src/components/sections/Footer.tsx` 구현**

```tsx
type FooterColumn = { title: string; links: string[] };

type FooterProps = {
  columns?: FooterColumn[];
};

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: 'Product', links: ['모의 면접', '피드백', '가격'] },
  { title: 'Company', links: ['소개', '블로그', '채용'] },
  { title: 'Resources', links: ['가이드', 'FAQ', '문의'] },
  { title: 'Legal', links: ['이용약관', '개인정보', '쿠키'] },
];

export function Footer({ columns = DEFAULT_COLUMNS }: FooterProps) {
  return (
    <footer className="rounded-lg bg-surface-dark px-8 py-16 text-on-dark-soft">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-title-sm font-medium text-on-dark">{column.title}</p>
            <ul className="mt-3 flex flex-col gap-2 text-body-sm">
              {column.links.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: 빌드 확인 + 커밋**

Run: `npm run build`
Expected: 성공
```bash
git add src/components/sections/HeroBand.tsx src/components/sections/CtaBand.tsx src/components/sections/Footer.tsx
git commit -m "feat : HeroBand·CtaBand·Footer 섹션 추가 #<issue>"
```

---

### Task 8: 라우팅 + AnalysisPage 이동 + ShowcasePage

**Files:**
- Create: `src/pages/AnalysisPage.tsx` (현재 `App.tsx` 본문 이동)
- Create: `src/pages/ShowcasePage.tsx`
- Modify: `src/App.tsx` (BrowserRouter 셸로 교체)

**Interfaces:**
- Consumes: 모든 `components/ui/*`, `components/sections/*`, `PRICING_TIERS`, `react-router-dom`(`BrowserRouter`·`Routes`·`Route`·`Link`).
- Produces: `AnalysisPage()`(named), `ShowcasePage()`(named), `App`(default) — `/`→AnalysisPage, `/showcase`→ShowcasePage.

- [ ] **Step 1: `src/pages/AnalysisPage.tsx` 생성 (현재 App.tsx 본문 이동, import 경로 `../`로 조정, `&&`→삼항)**

```tsx
import { useAnalysisQuery } from '../features/analysis/useAnalysisQuery';
import { useAnalysisStore } from '../stores/useAnalysisStore';

export function AnalysisPage() {
  const analysisId = useAnalysisStore((state) => state.analysisId);
  const setAnalysisId = useAnalysisStore((state) => state.setAnalysisId);
  const { data, isFetching, isLoading, error } = useAnalysisQuery(analysisId);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-50">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-cyan-300">Speech Mirror</p>
          <h1 className="text-3xl font-semibold">Frontend core is ready.</h1>
          <p className="max-w-2xl text-zinc-300">
            This app is prepared for async STT analysis flows with Axios, TanStack Query, and
            Zustand.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <label className="flex flex-col gap-2 text-sm text-zinc-300">
            Analysis ID
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-cyan-400"
              onChange={(event) => setAnalysisId(event.target.value)}
              placeholder="analysis-id"
              value={analysisId}
            />
          </label>

          <div className="mt-4 text-sm text-zinc-300">
            {isLoading ? <p>Loading analysis...</p> : null}
            {isFetching && !isLoading ? <p>Refreshing analysis...</p> : null}
            {error ? <p className="text-red-300">Unable to load analysis.</p> : null}
            {data ? (
              <pre className="overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-200">
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : null}
            {!analysisId ? <p>Enter an analysis ID to start polling.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: `src/pages/ShowcasePage.tsx` 생성**

```tsx
import { ReactNode } from 'react';

import { CtaBand } from '../components/sections/CtaBand';
import { Footer } from '../components/sections/Footer';
import { HeroBand } from '../components/sections/HeroBand';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CalloutCardCoral } from '../components/ui/CalloutCardCoral';
import { CategoryTab } from '../components/ui/CategoryTab';
import { CodeWindowCard } from '../components/ui/CodeWindowCard';
import { FeatureCard } from '../components/ui/FeatureCard';
import { IconButton } from '../components/ui/IconButton';
import { PricingTierCard } from '../components/ui/PricingTierCard';
import { ProductMockupCardDark } from '../components/ui/ProductMockupCardDark';
import { TextInput } from '../components/ui/TextInput';
import { PRICING_TIERS } from '../constants/pricing';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-display-md font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function ShowcasePage() {
  return (
    <main className="min-h-screen bg-canvas text-body">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-section px-6 py-12">
        <HeroBand
          eyebrow="AI 모의 면접"
          title="면접, 혼자서도 완벽하게"
          subtitle="AI와 실전처럼 연습하고 즉시 피드백을 받으세요."
          actions={
            <>
              <Button>무료로 시작</Button>
              <Button variant="secondary">데모 보기</Button>
            </>
          }
          aside={
            <ProductMockupCardDark title="실시간 피드백">
              답변 구조, 말 속도, 군더더기 표현을 분석합니다.
            </ProductMockupCardDark>
          }
        />

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="text-link">Text link</Button>
            <IconButton aria-label="더보기">→</IconButton>
          </div>
          <div className="rounded-lg bg-surface-dark p-6">
            <Button variant="secondary-on-dark">Secondary on dark</Button>
          </div>
        </Section>

        <Section title="Badges & Tabs">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>카테고리</Badge>
            <Badge variant="coral">NEW</Badge>
            <CategoryTab active>활성 탭</CategoryTab>
            <CategoryTab>비활성 탭</CategoryTab>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="max-w-sm">
            <TextInput placeholder="이메일을 입력하세요" />
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20" />
                </svg>
              }
              title="실전 질문"
            >
              직무별 맞춤 질문으로 연습합니다.
            </FeatureCard>
            <FeatureCard title="즉시 피드백">답변 직후 개선점을 제시합니다.</FeatureCard>
            <FeatureCard title="기록 관리">지난 면접을 다시 돌아봅니다.</FeatureCard>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ProductMockupCardDark title="대시보드">
              면접 진행 상황과 점수 추이를 한눈에.
            </ProductMockupCardDark>
            <CodeWindowCard
              filename="feedback.json"
              code={'{\n  "clarity": 0.86,\n  "pace": "보통",\n  "fillers": 3\n}'}
            />
          </div>
          <CalloutCardCoral
            title="지금 바로 면접을 연습하세요"
            action={<Button variant="secondary">무료로 시작</Button>}
          >
            카드 등록 없이 바로 시작할 수 있습니다.
          </CalloutCardCoral>
        </Section>

        <Section title="Pricing">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <PricingTierCard key={tier.name} {...tier} />
            ))}
          </div>
        </Section>

        <Section title="Sections">
          <CtaBand
            title="더 깊이 준비하고 싶다면"
            subtitle="프로 플랜으로 무제한 모의 면접과 상세 피드백을 받으세요."
            action={<Button variant="secondary">프로 보기</Button>}
          />
          <Footer />
        </Section>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: `src/App.tsx`를 라우터 셸로 교체**

```tsx
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

import { AnalysisPage } from './pages/AnalysisPage';
import { ShowcasePage } from './pages/ShowcasePage';

function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 border-b border-hairline bg-canvas px-6 py-3 text-nav-link">
        <Link to="/" className="text-ink">
          Analysis
        </Link>
        <Link to="/showcase" className="text-ink">
          Showcase
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<AnalysisPage />} />
        <Route path="/showcase" element={<ShowcasePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 4: 빌드 + 린트 확인**

Run: `npm run build`
Expected: 성공
Run: `npm run lint`
Expected: 통과(에러 0)

- [ ] **Step 5: 커밋**

```bash
git add src/App.tsx src/pages/AnalysisPage.tsx src/pages/ShowcasePage.tsx
git commit -m "feat : 라우팅·AnalysisPage 분리·Showcase 페이지 추가 #<issue>"
```

---

## 최종 검증 (end-to-end)

- [ ] `npm run lint` — ESLint 통과(경고 0 목표; `react-refresh/only-export-components`는 컴포넌트 단일 export로 회피)
- [ ] `npm run build` — 타입체크 + 프로덕션 빌드 성공
- [ ] `npm run dev` 후 브라우저:
  - `/showcase` — cream 캔버스 + coral CTA + dark mockup/footer 리듬, Pretendard 적용, 가격 3종(프로가 dark featured), 창 폭 줄여 카드 그리드 3→1 반응형 확인
  - `/` — 기존 analysis 데모 정상(dark), nav로 두 페이지 이동 확인

## Self-Review 결과

- **Spec 커버리지:** 토큰=T1, 폰트=T1, 버튼=T2, 배지·탭·인풋=T3, 카드 4종=T4·T5, 가격=T6, 섹션 3종=T7, 라우팅·페이지=T8. (테스트(F)는 해커톤 결정으로 제외.) 누락 없음.
- **Placeholder:** `#<issue>`만 의도적 변수(Global Constraints에 정의). 그 외 TBD/TODO 없음, 모든 코드 단계에 전체 코드 포함.
- **타입 일관성:** `cn` 시그니처, `PricingTier`/`PRICING_TIERS`, 컴포넌트 prop명이 정의 태스크와 사용 태스크에서 일치. `Button` variant 4종 문자열 T2 정의 == T6 사용(`secondary-on-dark`).
