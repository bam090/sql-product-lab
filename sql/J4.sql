-- J4 · USING으로 공통 카테고리 연결
-- 한 줄 개념: 두 테이블의 조인 열 이름이 같으면 USING으로 equality 조건을 짧게 쓸 수 있습니다.
-- 문법 틀: SELECT 열들 FROM 테이블1 JOIN 테이블2 USING (공통열);
-- 대상 테이블: products, categories
-- 반환 열: category, product_id, product_name, category_name
-- products와 categories를 JOIN ... USING (category)로 연결한다.
-- NATURAL JOIN은 사용하지 않는다.
-- category, product_id 순서로 오름차순 정렬한다.

-- TODO: 아래에 SELECT 문 하나를 작성하세요.
