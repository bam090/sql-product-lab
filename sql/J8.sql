-- J8 · 상품과 카테고리 전체 대조
-- 대상 테이블: categories, products
-- 반환 열: catalog_category, category_name, product_category, product_id, product_name
-- categories와 products를 category로 명시적 FULL OUTER JOIN한다.
-- catalog_category는 categories.category, product_category는 products.category로 반환한다.
-- Stationery의 상품 열은 NULL, Gift Card의 카테고리 표 열은 NULL로 남긴다.
-- catalog_category 오름차순 NULLS LAST, product_id 오름차순 NULLS LAST, product_category 오름차순으로 정렬한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
