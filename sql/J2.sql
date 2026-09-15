-- J2 · 빈 카테고리까지 상품 목록에 표시
-- 한 줄 개념: LEFT JOIN은 왼쪽 테이블의 모든 행을 보존하고, 매칭되지 않은 오른쪽 열을 NULL로 채웁니다.
-- 문법 틀: SELECT 열들 FROM 왼쪽테이블 AS 별칭1 LEFT JOIN 오른쪽테이블 AS 별칭2 ON 별칭1.열 = 별칭2.열;
-- 대상 테이블: practice.categories, practice.products
-- 반환 열: category, category_name, product_id, product_name
-- categories에서 시작해 products를 category로 LEFT JOIN한다.
-- 상품이 없는 Stationery도 한 행으로 남기고 상품 열은 NULL로 표시한다.
-- category, product_id 순서로 오름차순 정렬한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
