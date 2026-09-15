-- J7 · 가격을 가격 밴드에 연결
-- 대상 테이블: products, price_bands
-- 반환 열: product_id, product_name, price, band_id, band_name
-- product price가 price_bands의 min_price 이상 max_price 이하인 행을 연결한다.
-- BETWEEN을 ON 절에 사용한다.
-- 가격 밴드 구간이 겹치므로 한 상품이 여러 밴드에 나타날 수 있다.
-- product_id, band_id 순서로 오름차순 정렬한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
