# 작은 상점 SQL 실험실

## 1. 이번 연습

**아주 쉬운 한 줄 조회부터 시작해, 오늘 배운 SQL로 상품을 찾고 결과를 가공하는 연습입니다. 직접 작성할 코드는 `sql/` 안의 SELECT 문뿐입니다.**

- 핵심: SELECT · FROM · AS · 문자열 · ORDER BY · 계산식 · DISTINCT · WHERE · AND/OR · IN · BETWEEN · LIKE · NULL · LIMIT · 날짜 범위
- 예상 시간: 워밍업을 포함한 핵심 약 78분, 선택 약 10분. 한 번에 끝내지 않아도 됩니다.
- 데이터: 연습용 상품 20개. `practice.products` 테이블 하나를 사용합니다.
- 미리 구현한 부분: 화면, SQL 파일 읽기·저장, 쿼리 실행, 결과 표, 오류 표시, 기대 결과 비교.
- 정답 SQL은 이 프로젝트에 포함하지 않았습니다.

화면 하나에서 **워밍업 → 기본 조회 → 조건 조회 → 종합 조회** 순서로 모든 문제를 풀 수 있습니다. 처음에는 B1을 선택해 SQL 한 문장의 모양부터 익혀 보세요.

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

SQL 편집기에서 한 글자 이상 입력하면 키워드·테이블·컬럼명 후보가 나타납니다. `↑`·`↓`로 고르고 `Enter` 또는 `Tab`으로 확정하며, `Esc`로 닫을 수 있습니다. 후보가 없을 때 `Enter`는 줄바꿈, `Tab`은 공백 4칸 들여쓰기, `Shift + Tab`은 들여쓰기 줄이기입니다. 여러 줄을 선택해 함께 조절할 수도 있습니다. 편집기 밖으로 이동하려면 `Esc`를 누른 뒤 `Tab`을 누르세요.

> **DB 연결 완료:** 서울 리전의 무료 Supabase 프로젝트 `sql-product-lab`에 연결되어 있습니다. 연습용 상품 20개를 실제로 조회합니다. 연결 설정은 이미 준비했으므로 위 실행 순서대로 시작하세요. 기존 `festival-recommendation` 데이터베이스와는 별개입니다.

<details>
<summary>DB 연결 설정이 필요한 경우</summary>

연습 전용 Supabase 프로젝트를 준비한 뒤 `config/local.properties.example`을 `config/local.properties`로 복사하고, 실제 연결 주소와 조회 전용 계정을 입력합니다. 이 파일은 Git에서 제외됩니다. 기존 프로젝트의 관리자 계정을 넣지 않습니다.

`setup/seed.sql`은 AI가 연습용 데이터베이스를 처음 준비할 때 쓰는 파일입니다. 학습자가 작성할 과제가 아닙니다. 이번 범위는 조회이므로 INSERT·UPDATE·DELETE는 실행 대상에 포함하지 않습니다.

</details>

## 3. 내가 구현할 부분

워밍업 SQL 파일에는 한 줄 개념·문법 틀이 있고, 각 문제 파일에는 요구사항 주석과 TODO가 있습니다. **SELECT 문 하나**를 작성하세요. 테이블 이름은 `practice.products`로 고정합니다. 반환 열 이름도 아래 요구사항과 맞춰 주세요.

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

먼저 B1~B16을 순서대로 풀며 `SELECT`, `FROM`, `AS`, 문자열, `ORDER BY`, `DISTINCT`, `WHERE`, `AND`, `OR`, `IN`, `BETWEEN`, `LIKE`, `IS NULL`, `IS NOT NULL`, `LIMIT`를 한 가지씩 연습합니다. 정렬을 요구하지 않는 문제는 결과 행의 순서와 관계없이 채점합니다.

### B1. 모든 열 조회

작성 파일: [sql/B1.sql](sql/B1.sql) · 약 2분

- 한 줄 개념: `SELECT *`로 테이블의 모든 열을 조회합니다.
- `practice.products`의 모든 열을 별표(`*`)로 조회합니다.
- 문법 틀: `SELECT * FROM 테이블명;`

### B2. 열 하나 조회

작성 파일: [sql/B2.sql](sql/B2.sql) · 약 2분

- 한 줄 개념: `SELECT` 뒤에 열 이름을 쓰면 필요한 열만 조회할 수 있습니다.
- `product_name` 열 하나만 조회합니다.
- 문법 틀: `SELECT 열이름 FROM 테이블명;`

### B3. 열 여러 개 조회

작성 파일: [sql/B3.sql](sql/B3.sql) · 약 3분

- 한 줄 개념: 여러 열 이름을 쉼표로 구분해 함께 조회합니다.
- `product_name`, `price` 열을 이 순서로 조회합니다.
- 문법 틀: `SELECT 열1, 열2 FROM 테이블명;`

### B4. 열 이름에 별칭 붙이기

작성 파일: [sql/B4.sql](sql/B4.sql) · 약 3분

- 한 줄 개념: `AS`로 조회 결과의 열 이름을 바꿉니다.
- `product_name`을 `name`이라는 열 이름으로 반환합니다.
- 문법 틀: `SELECT 열이름 AS 새이름 FROM 테이블명;`

### B5. 문자열로 결과 열 만들기

작성 파일: [sql/B5.sql](sql/B5.sql) · 약 2분

- 한 줄 개념: 문자열과 `AS`를 사용해 원본 테이블에 없는 결과용 열을 만듭니다.
- 문자열 `'KRW'`를 `currency`라는 이름으로 반환하고, `FROM` 없이 한 행을 만듭니다.
- 문법 틀: `SELECT '문자열' AS 새이름;`

### B6. 열 하나 정렬

작성 파일: [sql/B6.sql](sql/B6.sql) · 약 3분

- 한 줄 개념: `ORDER BY`로 조회 결과를 오름차순 정렬합니다.
- `product_name` 열만 조회하고 같은 열을 오름차순 정렬합니다.
- 문법 틀: `SELECT 열이름 FROM 테이블명 ORDER BY 열이름 ASC;`

### B7. 중복 카테고리 제거

작성 파일: [sql/B7.sql](sql/B7.sql) · 약 2분

- 한 줄 개념: `DISTINCT`로 같은 값을 한 번씩만 조회합니다.
- `category`를 조회하고 중복을 제거합니다.
- 문법 틀: `SELECT DISTINCT 열이름 FROM 테이블명;`

### B8. 조건 하나로 품절 찾기

작성 파일: [sql/B8.sql](sql/B8.sql) · 약 2분

- 한 줄 개념: `WHERE`로 조건에 맞는 행만 조회합니다.
- `stock_quantity`가 0인 상품을 찾습니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 WHERE 열이름 = 값;`

### B9. 두 조건 모두 만족하기

작성 파일: [sql/B9.sql](sql/B9.sql) · 약 2분

- 한 줄 개념: `AND`로 두 조건을 모두 만족하는 행을 조회합니다.
- Electronics 카테고리이면서 재고가 0보다 큰 상품을 찾습니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 WHERE 조건1 AND 조건2;`

### B10. 두 조건 중 하나 만족하기

작성 파일: [sql/B10.sql](sql/B10.sql) · 약 2분

- 한 줄 개념: `OR`로 두 조건 중 하나라도 만족하는 행을 조회합니다.
- Books 또는 Sports 카테고리 상품을 찾습니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 WHERE 조건1 OR 조건2;`

### B11. 목록에 있는 값 찾기

작성 파일: [sql/B11.sql](sql/B11.sql) · 약 2분

- 한 줄 개념: `IN`으로 목록에 포함된 값을 간단히 조회합니다.
- Apparel 또는 Home 카테고리 상품을 `IN`으로 찾습니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 WHERE 열이름 IN ('값1', '값2');`

### B12. 양끝을 포함한 가격 범위

작성 파일: [sql/B12.sql](sql/B12.sql) · 약 2분

- 한 줄 개념: `BETWEEN`은 시작값과 끝값을 모두 포함해 범위를 조회합니다.
- 가격이 15 이상 22 이하인 상품을 찾습니다. 15와 22도 결과에 포함됩니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 WHERE 열이름 BETWEEN 시작값 AND 끝값;`

### B13. 대문자 S로 시작하는 이름

작성 파일: [sql/B13.sql](sql/B13.sql) · 약 2분

- 한 줄 개념: `LIKE`와 `%`로 특정 글자로 시작하는 문자열을 조회합니다.
- 상품명이 실제 데이터에 있는 대문자 S로 시작하는 상품을 찾습니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 WHERE 열이름 LIKE '접두어%';`

### B14. 설명이 없는 NULL 찾기

작성 파일: [sql/B14.sql](sql/B14.sql) · 약 2분

- 한 줄 개념: `IS NULL`로 값이 NULL인 행을 조회합니다.
- `description`이 NULL인 상품을 찾습니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 WHERE 열이름 IS NULL;`

### B15. NULL이 아닌 설명 찾기

작성 파일: [sql/B15.sql](sql/B15.sql) · 약 2분

- 한 줄 개념: `IS NOT NULL`로 NULL이 아닌 행을 조회합니다.
- `description`이 NULL이 아닌 상품을 찾습니다. 빈 문자열도 NULL이 아니므로 결과에 포함됩니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 WHERE 열이름 IS NOT NULL;`

### B16. 앞의 상품 수 제한하기

작성 파일: [sql/B16.sql](sql/B16.sql) · 약 2분

- 한 줄 개념: `LIMIT`로 조회할 행 수를 제한합니다.
- `product_id` 오름차순으로 정렬한 뒤 앞의 5개 상품만 조회합니다.
- 문법 틀: `SELECT 열이름들 FROM 테이블명 ORDER BY 정렬열 ASC LIMIT 개수;`

### S1. 필요한 상품 열만 조회

작성 파일: [sql/S1.sql](sql/S1.sql) · 약 4분

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

작성 파일: [sql/S2.sql](sql/S2.sql) · 약 6분

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

작성 파일: [sql/S3.sql](sql/S3.sql) · 약 4분

- category의 중복을 제거한다.
- category 오름차순으로 정렬한다.

완료 확인: `category` 열을 순서대로 반환하고, 기대 결과 7행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`DISTINCT`

</details>

### F1. 가격 범위와 재고 조건

작성 파일: [sql/F1.sql](sql/F1.sql) · 약 6분

- 가격이 20 이상 50 이하인 상품을 찾는다.
- 재고가 1개 이상인 상품만 남긴다.
- price, product_id 순서로 오름차순 정렬한다.

완료 확인: `product_id`, `product_name`, `price`, `stock_quantity` 열을 순서대로 반환하고, 기대 결과 8행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`BETWEEN`, `AND`

</details>

### F2. 카테고리와 이름 패턴 검색

작성 파일: [sql/F2.sql](sql/F2.sql) · 약 5분

- Electronics 또는 Books 카테고리만 대상으로 한다.
- 이름에 SQL이 들어가거나 Wireless로 시작하는 상품을 찾는다.
- product_id 오름차순으로 정렬한다.

완료 확인: `product_id`, `product_name`, `category` 열을 순서대로 반환하고, 기대 결과 3행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`IN`, `LIKE`, `AND`, `OR`, `괄호`

</details>

### F3. NULL과 빈 설명 검색

작성 파일: [sql/F3.sql](sql/F3.sql) · 약 5분

- description이 NULL이거나 TRIM 뒤 빈 문자열인 상품을 찾는다.
- product_id 오름차순으로 정렬한다.

완료 확인: `product_id`, `product_name`, `description` 열을 순서대로 반환하고, 기대 결과 8행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`IS NULL`, `TRIM`, `OR`

</details>

### F4. 9월 출시 범위 검색

작성 파일: [sql/F4.sql](sql/F4.sql) · 약 6분

- 2026-09-01 00:00:00 이상을 포함한다.
- 2026-10-01 00:00:00 미만만 포함한다.
- released_at, product_id 순서로 오름차순 정렬한다.

완료 확인: `product_id`, `product_name`, `released_at` 열을 순서대로 반환하고, 기대 결과 13행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`>= 시작`, `< 다음 달 시작`

</details>

### I1. 입고 준비 목록 통합 조회

작성 파일: [sql/I1.sql](sql/I1.sql) · 약 7분

- Electronics 또는 Books 카테고리만 대상으로 한다.
- 재고가 있고 2026년 9월에 출시된 상품만 남긴다.
- description이 NULL도 빈 문자열도 아닌 상품만 남긴다.
- product_name을 product로 반환한다.
- price와 stock_quantity를 곱하고 소수 둘째 자리까지 반올림해 inventory_value로 반환한다.
- 고정 문자열 ready를 status로 반환한다.
- product_id 오름차순으로 정렬한다.

완료 확인: `product_id`, `product`, `inventory_value`, `status` 열을 순서대로 반환하고, 기대 결과 3행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`IN`, `AND`, `IS NOT NULL`, `TRIM`, `ROUND`, `AS`

</details>

### O1. 대소문자 형태를 맞춘 SQL 검색 · 선택

작성 파일: [sql/O1.sql](sql/O1.sql) · 약 5분

- LOWER로 product_name의 대소문자 형태를 맞춘다.
- 이름에 sql이 들어간 상품을 찾는다.
- product_id 오름차순으로 정렬한다.

완료 확인: `product_id`, `product_name` 열을 순서대로 반환하고, 기대 결과 2행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`LOWER`, `LIKE`

</details>

### O2. 9월 14일 하루 범위 검색 · 선택

작성 파일: [sql/O2.sql](sql/O2.sql) · 약 5분

- 2026-09-14 00:00:00 이상을 포함한다.
- 2026-09-15 00:00:00 미만만 포함한다.
- released_at, product_id 순서로 오름차순 정렬한다.

완료 확인: `product_id`, `product_name`, `released_at` 열을 순서대로 반환하고, 기대 결과 2행과 값·순서가 일치합니다.

<details>
<summary>키워드 힌트</summary>

`>= 하루 시작`, `< 다음 날 시작`

</details>

## 5. 진행 순서

브랜치를 바꿀 필요 없이 한 화면에서 아래 순서대로 진행합니다.

| 순서 | 문제 | 연습 |
| --- | --- | --- |
| 1 | B1~B16 | 워밍업: 열 선택, 별칭, 문자열, 정렬, 중복 제거, 기본 조건, NULL, 행 수 제한 |
| 2 | S1~S3 | 기본 조회: 열 선택, 계산, 중복 제거 |
| 3 | F1~F4 | 조건 조회: 범위, 패턴, NULL, 날짜 |
| 4 | I1 | 종합 조회: 조건과 결과 가공 |
| 선택 | O1~O2 | 대소문자 검색과 하루 날짜 범위 |

B1부터 한 문제씩 실행하고 기대 결과와 비교하세요. 문제를 옮기기 전에 작성한 SQL을 **파일에 저장**하면 `sql/문제번호.sql`에 풀이가 남습니다.

공식 문서: [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html) · [조건식과 NULL](https://www.postgresql.org/docs/current/functions-comparison.html) · [Supabase 연결 방법](https://supabase.com/docs/guides/database/connecting-to-postgres)

제작 근거: 2026-09-14 수업 메모의 SQL 조회·조건·결과 가공 범위. AI가 만든 연습용 화면과 상품 데이터를 사용했습니다. 강사님의 퍼블리싱 디자인은 사용하지 않았습니다.
