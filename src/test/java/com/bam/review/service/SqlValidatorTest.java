package com.bam.review.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.bam.review.controller.ApiProblem;
import org.junit.jupiter.api.Test;

class SqlValidatorTest {
    private final SqlValidator validator = new SqlValidator();

    @Test
    void allowsOneSelectWhenQuotedTextAndCommentsContainSemicolons() {
        assertDoesNotThrow(() -> validator.validateSingleSelect("""
                /* lesson; note */
                SELECT 'a;b' AS value, $$c;d$$ AS other -- trailing; note
                ;
                """));
    }

    @Test
    void rejectsMultipleStatements() {
        assertThrows(ApiProblem.class, () -> validator.validateSingleSelect("select 1; select 2"));
    }

    @Test
    void rejectsNonSelectAndUnclosedQuotedText() {
        assertThrows(ApiProblem.class, () -> validator.validateSingleSelect("update practice.products set price = 1"));
        assertThrows(ApiProblem.class, () -> validator.validateSingleSelect("select 'unfinished"));
    }
}
