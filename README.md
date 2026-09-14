# 작은 상점 SQL 실험실

## 1. 이번 연습

**오늘 배운 SQL로 상품을 조회하고 결과를 가공하는 연습입니다. 직접 작성할 코드는 `sql/` 안의 SELECT 문뿐입니다.**

- 핵심: SELECT · FROM · AS · 계산식 · DISTINCT · WHERE · AND/OR · IN/LIKE · NULL · 날짜 범위
- 예상 시간: 핵심 약 43분, 선택 약 10분. 한 번에 끝내지 않아도 됩니다.
- 데이터: 연습용 상품 20개. `practice.products` 테이블 하나를 사용합니다.
- 미리 구현한 부분: 화면, SQL 파일 읽기·저장, 쿼리 실행, 결과 표, 오류 표시, 기대 결과 비교.
- 정답 SQL은 이 프로젝트에 포함하지 않았습니다.

**현재 브랜치: `codex/select` · 열 선택과 결과 가공**

이번 브랜치에서는 S1~S3을 풉니다. WHERE 조건은 다음 연습에서 다룹니다.

## 2. 실행하기

1. IntelliJ에서 **이 README가 있는 `sql-product-lab` 폴더**를 엽니다.
2. Project SDK와 Gradle JVM을 **Java 25**로 선택합니다. 수업의 BlogRest와 같은 **Spring Boot 4.1.1**입니다.
3. `ReviewApplication`을 실행하거나 아래 명령을 실행합니다. 실행 설정의 작업 디렉터리도 이 프로젝트 루트여야 합니다.

```bash
./gradlew bootRun
```

4. [SQL 실험실 열기](http://127.0.0.1:8094)에서 문제를 선택합니다.
5. 화면에서 SQL을 작성하고 **실행하기**를 누릅니다. 결과와 기대 결과를 비교합니다.
6. **파일에 저장**을 누르면 해당 `sql/문제번호.sql`에 저장됩니다. 실행만 누르면 파일을 덮어쓰지 않습니다.

IntelliJ에서 SQL 파일을 수정했다면 저장 후 화면의 **파일 다시 읽기**를 누르세요. 오류가 나면 입력한 SQL이 유지되고, 같은 화면 아래에 빨간 오류 메시지가 표시됩니다. `⌘ + Enter` 또는 `Ctrl + Enter`로도 실행할 수 있습니다.

SQL 편집기에서 두 글자 이상 입력하면 키워드·테이블·컬럼명 후보가 나타납니다. `↑`·`↓`로 고르고 `Tab`으로 확정하며, `Esc`로 닫을 수 있습니다.

> **DB 연결 완료:** 서울 리전의 무료 Supabase 프로젝트 `sql-product-lab`에 연결되어 있습니다. 연습용 상품 20개를 실제로 조회합니다. 연결 설정은 이미 준비했으므로 위 실행 순서대로 시작하세요. 기존 `festival-recommendation` 데이터베이스와는 별개입니다.

<details>
<summary>DB 연결 설정이 필요한 경우</summary>

연습 전용 Supabase 프로젝트를 준비한 뒤 `config/local.properties.example`을 `config/local.properties`로 복사하고, 실제 연결 주소와 조회 전용 계정을 입력합니다. 이 파일은 Git에서 제외됩니다. 기존 프로젝트의 관리자 계정을 넣지 않습니다.

`setup/seed.sql`은 AI가 연습용 데이터베이스를 처음 준비할 때 쓰는 파일입니다. 학습자가 작성할 과제가 아닙니다. 이번 범위는 조회이므로 INSERT·UPDATE·DELETE는 실행 대상에 포함하지 않습니다.

</details>

## 3. 내가 구현할 부분

각 SQL 파일에는 요구사항 주석과 TODO만 있습니다. **SELECT 문 하나**를 작성하세요. 테이블 이름은 `practice.products`로 고정합니다. 반환 열 이름도 아래 요구사항과 맞춰 주세요.

| 컬럼 | 타입 | 의미 |
| --- | --- | --- |
| `product_id` | `integer` | 상품 기본키 |
| `product_name` | `text` | 상품명 |
| `category` | `text` | 상품 카테고리 |
| `price` | `numeric(10,2)` | 판매 가격 |
| `stock_quantity` | `integer` | 재고 수량, 0은 품절 |
| `description` | `text nullable` | NULL과 빈 문자열이 각각 포함된 설명 |
| `released_at` | `timestamp without time zone` | 월말과 자정 경계를 포함한 출시 시각 |

SQL은 PostgreSQL 문법으로 실행합니다. 문자열은 `'KRW'`처럼 작은따옴표로 씁니다. `NULL`은 빈 문자열과 다릅니다. 날짜 범위는 시작 포함·다음 구간 시작 제외 방식도 연습합니다. 문제에 정렬이 지정되어 있으면 `ORDER BY`도 작성하세요.

## 4. 요구사항

화면의 **기대 결과 보기**에서도 반환 열과 모든 결과 행을 확인할 수 있습니다. 결과가 같더라도 조건을 어떻게 작성했는지 한 문장으로 설명해 보세요. 결과 비교는 이번 연습 데이터에 대한 확인이며, 어떤 데이터에도 맞는 SQL임을 증명하는 검사는 아닙니다.

### S1. 필요한 상품 열만 조회

작성 파일: [sql/S1.sql](sql/S1.sql) · 약 4분 · `codex/select`

- product_id를 id로 반환한다.
- product_name을 name으로 반환한다.
- category를 함께 반환한다.
- product_id 오름차순으로 정렬한다.

완료 확인: `id`, `name`, `category` 열을 순서대로 반환하고, 기대 결과 20행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`SELECT`, `FROM`, `AS`

</details>

### S2. 할인 가격 계산

작성 파일: [sql/S2.sql](sql/S2.sql) · 약 6분 · `codex/select`

- price를 original_price로 반환한다.
- price의 90%를 소수 둘째 자리까지 반올림해 sale_price로 반환한다.
- 조회 결과에 currency 열을 추가하고, 모든 행에 문자열 'KRW'를 표시하세요. currency는 원본 테이블에 없는 결과용 열입니다.
- product_id 오름차순으로 정렬한다.

완료 확인: `product_id`, `product_name`, `original_price`, `sale_price`, `currency` 열을 순서대로 반환하고, 기대 결과 20행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`ROUND`, `AS`, `문자열 리터럴`

</details>

### S3. 카테고리 중복 제거

작성 파일: [sql/S3.sql](sql/S3.sql) · 약 4분 · `codex/select`

- category의 중복을 제거한다.
- category 오름차순으로 정렬한다.

완료 확인: `category` 열을 순서대로 반환하고, 기대 결과 7행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`DISTINCT`

</details>








## 5. 브랜치 안내

하나의 프로젝트에서 브랜치만 바꿔 연습합니다. 브랜치를 바꾸면 **같은 README**의 현재 연습 안내와 화면에 표시되는 문제가 바뀝니다. 표 아래 순서대로 진행하면 됩니다.

| 순서 | 브랜치 | 연습 |
| --- | --- | --- |
| 전체 안내 | `codex/start` | 모든 문제 미리 보기 |
| 1 | `codex/select` | S1~S3: 열 선택·계산·중복 제거 |
| 2 | `codex/filters` | F1~F4: 조건·NULL·날짜, O1~O2 선택 연습 |
| 3 | `codex/integration` | I1: 조건과 결과 가공 종합 |

처음에는 `codex/select`에서 시작하세요. 한 브랜치의 풀이가 끝나면 IntelliJ의 Commit으로 **SQL 파일을 커밋한 다음** 다음 브랜치로 전환하세요. 저장하지 않은 SQL은 화면 전환 전 파일에 저장해야 합니다. Git이 변경 사항 충돌을 알리면 강제로 버리지 말고 현재 풀이를 먼저 커밋합니다.

```bash
git switch codex/select
# 풀이 후 IntelliJ에서 커밋
git switch codex/filters
# 풀이 후 IntelliJ에서 커밋
git switch codex/integration
```

브랜치를 전환한 뒤 웹 화면을 새로고침하면 새 문제 목록을 불러옵니다. 이전 SQL 풀이 파일은 각 브랜치의 커밋에 남습니다. 서로의 브랜치를 병합할 필요는 없습니다.

공식 문서: [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html) · [조건식과 NULL](https://www.postgresql.org/docs/current/functions-comparison.html) · [Supabase 연결 방법](https://supabase.com/docs/guides/database/connecting-to-postgres)

제작 근거: 2026-09-14 수업 메모의 SQL 조회·조건·결과 가공 범위. AI가 만든 연습용 화면과 상품 데이터를 사용했습니다. 강사님의 퍼블리싱 디자인은 사용하지 않았습니다.
