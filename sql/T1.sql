-- T1 · 카테고리별 최신 번호 정렬
-- 한 줄 개념: ORDER BY에 여러 열을 나열하면 앞 열의 동점 순서를 다음 열로 정할 수 있습니다.
-- 문법 틀: SELECT 열이름들 FROM 테이블명 ORDER BY 열1 ASC, 동점기준열 DESC;
-- 대상 테이블: practice.products
-- 반환 열: product_id, product_name, category
-- product_id, product_name, category를 조회한다.
-- category를 오름차순으로 정렬한다.
-- 같은 category 안에서는 product_id를 내림차순으로 정렬해 동점 순서를 고정한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
