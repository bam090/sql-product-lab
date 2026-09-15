-- T7 · 소문자 기준 상품명 정렬
-- 한 줄 개념: ORDER BY에서 LOWER를 사용하면 문자열의 소문자 형태를 기준으로 정렬할 수 있습니다.
-- 문법 틀: SELECT 열이름들 FROM 테이블명 ORDER BY LOWER(문자열열) ASC, 고유열 ASC;
-- 대상 테이블: products
-- 반환 열: product_id, product_name
-- product_id와 product_name을 조회한다.
-- LOWER(product_name)을 오름차순 정렬 기준으로 사용한다.
-- 소문자 형태가 같으면 product_id를 오름차순으로 정렬한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
