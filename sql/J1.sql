-- J1 · 상품과 카테고리 이름 연결
-- 한 줄 개념: INNER JOIN은 ON 조건이 양쪽에서 일치하는 행만 연결합니다.
-- 문법 틀: SELECT 열들 FROM 테이블1 AS 별칭1 INNER JOIN 테이블2 AS 별칭2 ON 별칭1.열 = 별칭2.열;
-- 대상 테이블: practice.products, practice.categories
-- 반환 열: product_id, product_name, category_name
-- products와 categories의 category가 같은 행을 명시적 INNER JOIN으로 연결한다.
-- 매칭되는 상품만 반환한다. categories에 없는 Other 상품은 결과에서 제외된다.
-- product_id 오름차순으로 정렬한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
