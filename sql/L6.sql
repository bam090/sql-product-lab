-- L6 · 두 재고 목록의 앞부분 합치기
-- 대상 테이블: products
-- 반환 열: queue_source, sort_id, product_name
-- 첫 SELECT는 재고가 0인 상품을 product_id 오름차순으로 정렬해 2행만 고르고 queue_source를 sold_out으로 반환한다.
-- 둘째 SELECT는 재고가 1 이상 5 이하인 상품을 product_id 오름차순으로 정렬해 2행만 고르고 queue_source를 low_stock으로 반환한다.
-- 두 SELECT 모두 product_id를 sort_id라는 이름으로 반환하고 product_name도 함께 반환한다.
-- 두 결과를 UNION ALL로 합친 뒤 queue_source, sort_id 오름차순으로 최종 정렬한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
