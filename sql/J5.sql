-- J5 · 모든 카테고리와 가격 밴드 조합
-- 한 줄 개념: CROSS JOIN은 왼쪽의 각 행과 오른쪽의 모든 행을 한 번씩 조합합니다.
-- 문법 틀: SELECT 열들 FROM 테이블1 CROSS JOIN 테이블2;
-- 대상 테이블: categories, price_bands
-- 반환 열: category, category_name, band_id, band_name
-- 모든 카테고리와 모든 가격 밴드의 조합을 명시적 CROSS JOIN으로 만든다.
-- 콤마 조인은 사용하지 않는다.
-- category, band_id 순서로 오름차순 정렬한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
