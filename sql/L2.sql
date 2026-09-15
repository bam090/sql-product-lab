-- L2 · 최신 상품 두 번째 페이지
-- 한 줄 개념: OFFSET은 정렬된 결과의 앞 행을 건너뛰고, LIMIT은 그다음에 가져올 행 수를 정합니다.
-- 문법 틀: SELECT 열들 FROM 테이블명 ORDER BY 기준열 DESC, 고유열 DESC LIMIT 개수 OFFSET 건너뛸개수;
-- 대상 테이블: products
-- 반환 열: product_id, product_name, released_at
-- product_id, product_name, released_at을 조회한다.
-- released_at을 내림차순으로 정렬하고 같은 시각에서는 product_id를 내림차순으로 정렬한다.
-- 앞의 4행을 건너뛴 뒤 다음 4행을 반환한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
