-- T8 · 카테고리별 상품 수 집계
-- 한 줄 개념: GROUP BY로 같은 값을 묶고 COUNT(*)로 각 그룹의 행 수를 셉니다.
-- 문법 틀: SELECT 그룹열, COUNT(*) AS 새이름 FROM 테이블명 GROUP BY 그룹열;
-- 대상 테이블: practice.products
-- 반환 열: category, product_count
-- category별로 행을 묶는다.
-- 각 category의 전체 상품 행 수를 COUNT(*)로 센다.
-- COUNT 결과 열 이름은 product_count로 붙인다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
