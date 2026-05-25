
## 목표

1. koima.json(15,814건) → Lovable Cloud DB 이관
2. `/admin` 페이지에서 업체 데이터 CRUD (인증 없음 — 데모용)
3. 메인 페이지 UI/UX: 모바일 반응형, 비주얼 톤 리프레시, 성능(가상 스크롤)

## 1. 데이터베이스

Lovable Cloud 활성화 후 다음 테이블 생성:

```text
companies
  id              uuid PK
  biz_no          text
  name_kr         text
  name_en         text
  email           text
  phone           text
  scale_code      smallint  (6~15)
  asean_countries text[]    (e.g. ['베트남','태국'])
  other_countries text[]
  created_at      timestamptz
  updated_at      timestamptz

  -- 인덱스: name_kr, biz_no, scale_code, asean_countries(GIN)
```

`scale`/`asean` 메타는 코드에 상수로 유지(자주 변하지 않음).

### 데이터 적재
- `psql \copy` 로 변환한 CSV 일괄 import (스크립트 한 번 실행)
- RLS: 데모이므로 anon SELECT/INSERT/UPDATE/DELETE 모두 허용 (⚠️ 사용자에게 보안 경고 명시)

## 2. 서버 함수

`src/lib/companies.functions.ts`:
- `listCompanies({ q, asean, scale, hasEmail, sort, page, pageSize })` — 서버 사이드 페이지네이션 + 카운트
- `getCompany(id)`, `createCompany(input)`, `updateCompany(id, input)`, `deleteCompany(id)`
- `getStats()` — 국가별 집계 (BarChart 용)

`supabaseAdmin` 사용 (무인증 정책).

## 3. 메인 페이지 개선 (`/`)

- 데이터를 DB에서 fetch (서버 페이지네이션, 한 번에 40~60건)
- React Query로 캐싱
- **모바일**: 필터 패널을 bottom sheet(Drawer)로, 카드 1열, 상단 sticky 검색
- **비주얼 톤**: 여백/타이포 정리, 카드 그림자/라운드 통일, accent 컬러 강조 축소
- **성능**: 페이지네이션 기반이라 가상 스크롤은 불필요 → 부드러운 페이지 전환 + skeleton만 유지
- BarChart는 `getStats()` 결과로 렌더

## 4. 관리자 페이지 (`/admin`)

- 좌측 사이드바 메뉴: 업체 목록 / 통계
- 테이블 뷰 (TanStack Table 스타일, shadcn Table)
  - 검색, 필터, 정렬
  - 페이지네이션
  - 행 클릭 → 편집 다이얼로그
- "신규 등록" 버튼 → 폼 다이얼로그 (react-hook-form + zod)
- 행 우측 삭제 버튼 (확인 다이얼로그)
- CSV 일괄 import/export 버튼
- ⚠️ 상단에 "데모용 — 인증 없음" 경고 배너

## 5. 라우팅

```text
src/routes/
  __root.tsx     (헤더에 / · /admin 링크 추가)
  index.tsx      (개선)
  admin.tsx      (사이드바 레이아웃 + Outlet)
  admin.index.tsx (업체 목록 CRUD)
```

## 작업 순서

1. Lovable Cloud 활성화
2. 마이그레이션 + 데이터 import 스크립트
3. companies.functions.ts (서버 함수)
4. /admin 페이지 (CRUD)
5. index.tsx 리팩토링 (DB fetch + 모바일/비주얼)
6. QA: 모바일 뷰포트 확인

## 주의사항

- `/admin` 무인증은 데모 한정. 실제 배포 전 반드시 로그인 추가 필요 — 작업 완료 후 강조해서 안내
- 15k INSERT는 마이그레이션이 아닌 데이터 적재로 처리(psql \copy)
