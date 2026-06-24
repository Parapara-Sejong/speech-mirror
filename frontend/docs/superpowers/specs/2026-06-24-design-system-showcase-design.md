# DESIGN.md 기반 디자인 시스템 컴포넌트 + Showcase — 설계

- 날짜: 2026-06-24
- 이슈: `.issues/20260624_기능추가_디자인_시스템_컴포넌트_구축.md`
- 기준 문서: `frontend/.claude/rules/DESIGN.md`

## Context

현재 프론트(React 19 + Vite + TS + Tailwind v4)에는 DESIGN.md의 디자인 시스템이 코드로 반영돼 있지 않다. `styles.css`는 `@import 'tailwindcss'`만 있고 토큰 미연결, 화면은 dark analysis 폴링 데모 하나뿐이다. 이 작업은 **DESIGN.md(cream + coral + dark navy)를 Tailwind v4 토큰으로 박고, 재사용 컴포넌트 세트를 만들고, 그것들을 한눈에 검수하는 showcase 페이지**를 추가한다. 제품 맥락은 **AI 모의 면접**이며, 가격 티어(무료/프로/맥스)를 showcase 안의 한 예시로 둔다.

목표는 "디자인 시스템 검수 가능한 컴포넌트 갤러리"이지 완성된 랜딩 페이지가 아니다.

## 확정 결정

| 항목 | 결정 |
|---|---|
| 결과물 | 컴포넌트 **showcase 갤러리 페이지** (`/showcase`) |
| 라우팅 | `react-router-dom` 추가. `/` = 기존 analysis 데모(dark, 그대로), `/showcase` = 갤러리(cream) |
| 토큰 | DESIGN.md 색·타이포·radius·일부 spacing → `styles.css` `@theme` 전역 유틸 |
| 폰트 | **Pretendard 통일**(sans+display), mono=JetBrains Mono. `index.html` CDN/Google Fonts `<link>` 로드(의존성 0) |
| 가격 | 무료/프로/맥스 **최소 더미**(가격+기능 2~4줄), `constants/pricing.ts`. 프로=featured(dark surface) |
| 테스트 | vitest + jsdom + testing-library 도입, **로직 있는 곳만** 테스트 |

## A. 토큰 wiring — `src/styles.css` `@theme`

DESIGN.md 값을 그대로 매핑. Tailwind v4 기본과 다른 값(radius)은 **반드시 override**.

**색** (`--color-*` → `bg-*`/`text-*`/`border-*`)
primary `#cc785c`, primary-active `#a9583e`, primary-disabled `#e6dfd8`, accent-teal `#5db8a6`, accent-amber `#e8a55a`, canvas `#faf9f5`, surface-soft `#f5f0e8`, surface-card `#efe9de`, surface-cream-strong `#e8e0d2`, surface-dark `#181715`, surface-dark-elevated `#252320`, surface-dark-soft `#1f1e1b`, hairline `#e6dfd8`, hairline-soft `#ebe6df`, ink `#141413`, body-strong `#252523`, body `#3d3d3a`, muted `#6c6a64`, muted-soft `#8e8b82`, on-primary `#ffffff`, on-dark `#faf9f5`, on-dark-soft `#a09d96`, success `#5db872`, warning `#d4a017`, error `#c64545`

**타이포** (`--text-*` + `--text-*--line-height` + `--text-*--letter-spacing`) — size/lh/tracking만 토큰화, 굵기는 컴포넌트에서 유틸로 적용
display-xl 64/1.05/-1.5px, display-lg 48/1.1/-1px, display-md 36/1.15/-0.5px, display-sm 28/1.2/-0.3px, title-lg 22/1.3/0, title-md 18/1.4/0, title-sm 16/1.4/0, body-md 16/1.55/0, body-sm 14/1.55/0, caption 13/1.4/0, caption-uppercase 12/1.4/1.5px, code 14/1.6/0, button 14/1.0/0, nav-link 14/1.4/0
> Pretendard(sans)로 통일했으므로 display 위계는 weight로 보강: 컴포넌트에서 display 계열에 `font-semibold`(600), title 계열 `font-medium`(500), body 400. DESIGN.md의 serif 400 규칙은 폰트 교체로 대체됨. 음수 letter-spacing은 유지(모던 타이트룩).

**radius** (Tailwind 기본과 다름 → override) `--radius-xs:4px --radius-sm:6px --radius-md:8px --radius-lg:12px --radius-xl:16px`, pill/full = `rounded-full`

**spacing** 의미 토큰만 추가: `--spacing-section:96px` (→ `py-section`). 나머지(16/24/32/48px 등)는 Tailwind 기본 수치 유틸 사용(`p-4 p-6 p-8 p-12`).

**폰트 토큰**
`--font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;`
`--font-display:` (sans와 동일)
`--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;`

`styles.css`의 기존 `color-scheme: dark`/body Inter 스택은 정리(showcase는 cream, analysis는 페이지 내부에서 dark 클래스로 처리).

## B. 폰트 로드 — `index.html`
`<head>`에 추가(의존성 0):
- preconnect: `https://fonts.googleapis.com`, `https://fonts.gstatic.com`, `https://cdn.jsdelivr.net`
- Pretendard: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable-dynamic-subset.css`
- JetBrains Mono: Google Fonts `<link>` (`JetBrains+Mono:wght@400`)

## C. 컴포넌트 (`src/components/`, 작은 파일 다수)

`lib/cn.ts` — `(...c) => c.filter(Boolean).join(' ')` (의존성 X)

**`components/ui/`** (각 파일 1 컴포넌트)
- `Button.tsx` — `variant: 'primary'|'secondary'|'secondary-on-dark'|'text-link'`(기본 primary) + 표준 button 속성. base `h-10 px-5 rounded-md text-button`, variant별 토큰 클래스 맵(cn). active 상태만(hover 없음, DESIGN.md 규칙).
- `IconButton.tsx` — 원형 36px, hairline border, `children`(lucide 아이콘) + button 속성.
- `Badge.tsx` — `variant: 'pill'|'coral'`. caption 타이포, `rounded-full`.
- `CategoryTab.tsx` — `active?: boolean` + button 속성. active=surface-card+ink, inactive=transparent+muted.
- `TextInput.tsx` — 표준 input 속성. hairline border, focus 시 coral border + 링.
- `FeatureCard.tsx` — `{ icon?, title, children }`. surface-card, `rounded-lg p-8`.
- `ProductMockupCardDark.tsx` — `{ title?, children }`. surface-dark, on-dark 텍스트.
- `CodeWindowCard.tsx` — `{ code: string; filename? }`. surface-dark + 내부 surface-dark-soft, JetBrains Mono, 줄번호(코드 `\n` split), 상단 점 3개 + filename 크롬.
- `CalloutCardCoral.tsx` — `{ title, children?, action? }`. primary 배경, 내부는 cream 버튼(secondary on coral).
- `PricingTierCard.tsx` — `{ name, price, period?, features: string[], featured?, ctaLabel }`. featured=true면 surface-dark + on-dark로 반전, 아니면 canvas+hairline. price는 display-sm.

**`components/sections/`**
- `HeroBand.tsx` — `{ eyebrow?, title, subtitle?, actions?, aside? }`. 6/6 그리드(데스크톱), 모바일 1열.
- `CtaBand.tsx` — `{ variant: 'coral'|'dark', title, subtitle?, action? }`. 풀폭 밴드, `p-16`.
- `Footer.tsx` — `{ columns? }`(기본값 내장). surface-dark, 4열→1열.

DESIGN.md에 있으나 이슈 범위 밖인 **`ModelComparisonCard`는 스킵**(YAGNI, 필요 시 추가).

## D. 페이지 / 라우팅
- `App.tsx` → `<BrowserRouter>` + `<Routes>` 셸로 축소. 두 라우트 간 이동용 최소 nav 링크 포함.
- `pages/AnalysisPage.tsx` ← 현재 `App.tsx` 본문 그대로 이동(dark 유지).
- `pages/ShowcasePage.tsx` ← `bg-canvas` 페이지. 카테고리별 섹션(Buttons / Badges & Tabs / Inputs / Cards / Pricing / Sections)에 라벨 heading + 각 컴포넌트 인스턴스 나열. 가격은 `PRICING_TIERS` map으로 `PricingTierCard` 3-up(반응형 3→1).

## E. 가격 데이터 — `src/constants/pricing.ts`
```ts
export type PricingTier = {
  name: string; price: string; period?: string;
  features: string[]; featured?: boolean; ctaLabel: string;
};
export const PRICING_TIERS: PricingTier[] = [
  { name: '무료', price: '₩0', period: '/월',
    features: ['월 3회 모의 면접', '기본 피드백', '기록 7일 보관'], ctaLabel: '무료로 시작' },
  { name: '프로', price: '₩19,000', period: '/월', featured: true,
    features: ['무제한 모의 면접', 'AI 상세 피드백', '직무별 질문 세트', '기록 무제한'], ctaLabel: '프로 시작하기' },
  { name: '맥스', price: '₩49,000', period: '/월',
    features: ['프로 전체 포함', '실시간 음성 면접', '맞춤 커리큘럼', '우선 지원'], ctaLabel: '맥스 시작하기' },
];
```
> 더미값. 실제 가격/기능은 나중에 이 파일만 수정(calibration 노브).

## F. 테스트 (vitest)
신규 dev 의존성: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`. `package.json`에 `"test": "vitest run"`. `vite.config.ts`에 `test`(env jsdom, globals, setup 파일) 추가.
**로직 있는 곳만** (마크업 전수 스냅샷 X):
- `cn.test.ts` — truthy join, false/null 제거
- `Button.test.tsx` — variant→토큰 클래스 매핑(primary는 bg-primary 포함, text-link는 미포함), children 렌더
- `PricingTierCard.test.tsx` — featured 분기(dark surface 클래스), features 전부 렌더
- `ShowcasePage.test.tsx` — smoke 렌더(알려진 heading 존재)

## 검증 (end-to-end)
1. `npm install` (신규: `react-router-dom` / dev: vitest·jsdom·testing-library 2종)
2. `npm run build` — `tsc -b` 타입체크 + 빌드 통과
3. `npm test` — vitest 통과
4. `npm run dev` → `/showcase` 육안: cream 캔버스 + coral CTA + dark mockup 리듬, 가격 3종(프로 dark featured), 창 줄여 반응형 3→1 확인. `/` analysis 데모 정상.

## 의도적으로 뺀 것 (skipped)
- `ModelComparisonCard` — add when 모델/플랜 비교 UI 실제 필요
- serif display 폰트 — Pretendard 통일로 대체(한글 커버리지)
- 마크업 전수 스냅샷·E2E — presentational이라 가치 낮음, add when 인터랙션 로직 생기면
