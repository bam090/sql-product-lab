-- L1 · 비싼 상품 세 개 고르기
-- 한 줄 개념: LIMIT은 정렬된 결과의 앞부분만 반환하며, 고유한 열을 동점 기준으로 더하면 결과 순서가 고정됩니다.
-- 문법 틀: SELECT 열들 FROM 테이블명 ORDER BY 기준열 DESC, 고유열 ASC LIMIT 개수;
-- 대상 테이블: products
-- 반환 열: product_id, product_name, price
-- product_id, product_name, price를 조회한다.
-- price를 내림차순으로 정렬하고 같은 가격에서는 product_id를 오름차순으로 정렬한다.
-- 정렬된 결과에서 앞의 3행만 반환한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
