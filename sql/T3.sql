-- T3 · 상품 표시 이름 연결
-- 한 줄 개념: || 연산자는 열 값과 문자열을 왼쪽부터 이어 붙입니다.
-- 문법 틀: SELECT 열이름, 열1 || '구분자' || 열2 AS 새이름 FROM 테이블명;
-- 대상 테이블: products
-- 반환 열: product_id, product_label
-- product_id를 원본 열 이름 그대로 조회한다.
-- product_name, 문자열 ' / ', category를 ||로 이어 붙인다.
-- 연결한 결과 열 이름은 product_label로 붙인다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
