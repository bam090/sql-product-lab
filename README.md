# 작은 상점 SQL 실험실

상품 20개와 카테고리·가격대 표로 SQL을 연습하는 작은 실험실입니다.

정답 SQL은 보여주지 않고, 힌트와 기대 결과로 풀이를 확인합니다.

## [브라우저에서 바로 풀기 →](https://bam090.github.io/sql-product-lab/)

설치나 로그인 없이 열 수 있습니다. 처음에는 브라우저용 DB를 준비하므로 잠시 기다릴 수 있어요.

## 이렇게 시작하세요

1. 위 링크를 열고 DB 준비가 끝나면 **B1**을 고릅니다.
2. 문제 설명을 보고 `SELECT` 문 하나를 작성합니다.
3. **실행하기**를 누르고 정답 여부를 확인합니다. 결과가 다르면 **기대 결과 보기**에서 열과 행을 비교하세요.
4. B1부터 차례로 푼 뒤, 다음 단계 문제로 넘어갑니다.

화면에서 SQL을 고치고 다시 실행해도 됩니다. 공유 페이지에서는 **브라우저에 저장**을 누르면 현재 기기에 풀이가 남습니다.

## 무엇을 연습하나요

각 문제의 요구사항은 실습 화면과 [SQL 파일](sql)에서 확인할 수 있습니다.

| 화면 분류 | 다루는 내용 |
| --- | --- |
| SELECT | 열 선택, 별칭, 문자열, 계산, CASE, GROUP BY·COUNT |
| WHERE | AND/OR, IN, BETWEEN, LIKE, NULL, 여러 조건 조합 |
| ORDER BY | 오름차순·내림차순, 여러 정렬 기준, 별칭, NULL 위치, LIMIT·OFFSET 페이지, keyset 커서 |
| JOIN | INNER·LEFT·SELF·CROSS·FULL, 연속 JOIN, USING, 연결 후 개수 세기, 가격 범위 연결 |

총 **50문제**입니다. 화면에서는 **기본 개념 문제**와 **응용 문제**를 고르고, 각 묶음에서 SELECT·WHERE·ORDER BY·JOIN 분류를 접고 펼칠 수 있어요. 기본 개념 문제는 문법 하나에 집중하고, 응용 문제는 현재 배운 범위에서 실무 상황을 조합합니다. 문자열 연결, keyset 커서, 범위 배치, UNION ALL 조합, 연속 JOIN과 self LEFT JOIN은 선택 문제입니다. 브랜치를 바꿀 필요는 없습니다.

JOIN에서는 왼쪽의 **확인할 테이블**을 바꿔 구조를 살펴보고 **원본 테이블 보기**로 데이터를 확인하세요. SQL 파일에서는 요구사항 주석 아래에 SELECT 문 하나를 작성합니다.

## 저장과 브라우저 안내

- 공유 페이지는 PGlite(PostgreSQL)를 각자의 브라우저에서 실행합니다. 외부 DB에 연결하지 않습니다.
- 저장한 SQL은 현재 브라우저와 기기에만 남습니다. 다른 기기와 동기화되지 않으며, 브라우저 데이터를 지우면 사라질 수 있습니다.
- 로컬 Java 버전은 **파일에 저장**을 누르면 `sql/문제번호.sql`에 저장합니다. SQL 파일을 직접 바꿨다면 **파일 다시 읽기**를 누르세요.

## 키보드

- `⌘ + Enter` 또는 `Ctrl + Enter`: 실행
- 자동완성: `↑` `↓`로 선택, `Enter` 또는 `Tab`으로 확정, `Esc`로 닫기
- 자동완성이 없을 때: `Enter`는 줄바꿈, `Tab`과 `Shift + Tab`은 들여쓰기
- 편집기 밖으로 이동: `Esc` 뒤 `Tab`

<details>
<summary>로컬 Java 버전 실행하기</summary>

SQL 파일을 편집하며 로컬에서 실행하려면 Java 25와 Spring Boot 4.1.1 환경이 필요합니다.

IntelliJ를 쓴다면 프로젝트 루트를 열고 Project SDK와 Gradle JVM을 Java 25로 맞춘 뒤 `ReviewApplication`을 실행해도 됩니다.

처음 실행하는 경우에는 아래 DB 준비를 먼저 마치세요. 이미 `config/local.properties`가 있다면 그대로 사용하면 됩니다.

<details>
<summary>처음 한 번 하는 DB 준비</summary>

1. 연습 전용 Supabase 프로젝트를 준비합니다.
2. SQL Editor에서 [setup/seed.sql](setup/seed.sql)을 **한 번만** 실행해 `practice.products`와 상품 20개를 만듭니다. 테이블이 이미 있다면 다시 실행하지 마세요.
3. [setup/join-seed.sql](setup/join-seed.sql)을 실행해 카테고리·가격대 표를 추가합니다. 기존 상품 데이터는 바뀌지 않습니다.
4. 같은 SQL Editor에서 조회 전용 계정과 RLS 정책을 만듭니다. 비밀번호는 직접 정하세요.

```sql
CREATE ROLE practice_reader LOGIN PASSWORD '본인이_정한_비밀번호';
GRANT USAGE ON SCHEMA practice TO practice_reader;
GRANT SELECT ON practice.products, practice.categories, practice.price_bands TO practice_reader;
ALTER TABLE practice.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY practice_reader_select ON practice.products
    FOR SELECT TO practice_reader USING (true);
ALTER TABLE practice.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY practice_reader_select ON practice.categories
    FOR SELECT TO practice_reader USING (true);
ALTER TABLE practice.price_bands ENABLE ROW LEVEL SECURITY;
CREATE POLICY practice_reader_select ON practice.price_bands
    FOR SELECT TO practice_reader USING (true);
```

5. [config/local.properties.example](config/local.properties.example)을 같은 폴더에 `local.properties`로 복사합니다.
6. Supabase **Connect → Session pooler**에서 호스트와 프로젝트 참조값을 확인해 아래 값을 채웁니다.

```properties
lab.database.url=jdbc:postgresql://POOLER_HOST:5432/postgres
lab.database.user=practice_reader.PROJECT_REF
lab.database.password=본인이_정한_비밀번호
```

`POOLER_HOST`와 `PROJECT_REF`는 실제 값으로 바꿔야 합니다. 앱은 SSL로 연결합니다. 조회 전용 계정 정보를 사용하세요. `local.properties`는 Git에서 제외됩니다.

</details>

프로젝트 루트에서 실행합니다.

```bash
./gradlew bootRun
```

[http://127.0.0.1:8094](http://127.0.0.1:8094)을 열고 문제를 선택하세요. 이 앱은 조회 전용 실습용이며, 학습자가 작성하는 SQL은 SELECT 문입니다. 실행만 하면 파일은 바뀌지 않고, **파일에 저장**을 눌러야 풀이가 저장됩니다.

</details>

<details>
<summary>공유 페이지를 수정할 때</summary>

Node.js 22에서 아래 명령을 실행하면 GitHub Pages용 파일이 `dist-pages/`에 만들어집니다.

```bash
npm ci
npm run build:pages
```

공유 페이지는 [문제 목록](exercises.json)의 시작 SQL을 사용하므로 로컬 풀이 파일은 배포물에 포함되지 않습니다.

</details>

## 더 보기

- [문제 SQL 파일](sql)
- [연습 데이터 만들기](setup/seed.sql)
- [PostgreSQL SELECT 문서](https://www.postgresql.org/docs/current/sql-select.html)
