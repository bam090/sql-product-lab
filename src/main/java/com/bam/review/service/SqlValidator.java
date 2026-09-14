package com.bam.review.service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.bam.review.controller.ApiProblem;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class SqlValidator {
    public void validateSingleSelect(String sql) {
        if (sql == null || sql.isBlank()) {
            throw invalid("실행할 SQL을 작성해 주세요.");
        }
        if (sql.getBytes(StandardCharsets.UTF_8).length > ExerciseStore.MAX_SQL_BYTES) {
            throw invalid("SQL은 16KB 이하로 작성해 주세요.");
        }
        if (sql.indexOf('\0') >= 0) {
            throw invalid("SQL에 허용되지 않은 문자가 있습니다.");
        }

        String structural = maskCommentsAndQuotedText(sql);
        String trimmed = structural.stripLeading();
        if (!startsWithSelect(trimmed)) {
            throw invalid("SELECT 문 하나만 실행할 수 있습니다.");
        }

        List<Integer> terminators = new ArrayList<>();
        for (int i = 0; i < structural.length(); i++) {
            if (structural.charAt(i) == ';') {
                terminators.add(i);
            }
        }
        if (terminators.size() > 1) {
            throw invalid("SELECT 문 하나만 실행할 수 있습니다.");
        }
        if (terminators.size() == 1 && !structural.substring(terminators.getFirst() + 1).isBlank()) {
            throw invalid("SELECT 문 하나만 실행할 수 있습니다.");
        }
    }

    private boolean startsWithSelect(String sql) {
        if (!sql.toLowerCase(Locale.ROOT).startsWith("select")) {
            return false;
        }
        return sql.length() == 6 || !Character.isJavaIdentifierPart(sql.charAt(6));
    }

    private String maskCommentsAndQuotedText(String sql) {
        StringBuilder masked = new StringBuilder(sql.length());
        State state = State.NORMAL;
        int blockDepth = 0;
        String dollarDelimiter = null;

        for (int i = 0; i < sql.length(); i++) {
            char current = sql.charAt(i);
            char next = i + 1 < sql.length() ? sql.charAt(i + 1) : '\0';

            if (state == State.NORMAL) {
                if (current == '\'') {
                    masked.append(' ');
                    state = State.SINGLE_QUOTE;
                } else if (current == '"') {
                    masked.append(' ');
                    state = State.DOUBLE_QUOTE;
                } else if (current == '-' && next == '-') {
                    masked.append("  ");
                    i++;
                    state = State.LINE_COMMENT;
                } else if (current == '/' && next == '*') {
                    masked.append("  ");
                    i++;
                    blockDepth = 1;
                    state = State.BLOCK_COMMENT;
                } else if (current == '$' && dollarDelimiterAt(sql, i) != null) {
                    dollarDelimiter = dollarDelimiterAt(sql, i);
                    masked.append(" ".repeat(dollarDelimiter.length()));
                    i += dollarDelimiter.length() - 1;
                    state = State.DOLLAR_QUOTE;
                } else {
                    masked.append(current);
                }
                continue;
            }

            if (state == State.SINGLE_QUOTE) {
                masked.append(current == '\n' ? '\n' : ' ');
                if (current == '\'' && next == '\'') {
                    masked.append(' ');
                    i++;
                } else if (current == '\'') {
                    state = State.NORMAL;
                }
                continue;
            }

            if (state == State.DOUBLE_QUOTE) {
                masked.append(current == '\n' ? '\n' : ' ');
                if (current == '"' && next == '"') {
                    masked.append(' ');
                    i++;
                } else if (current == '"') {
                    state = State.NORMAL;
                }
                continue;
            }

            if (state == State.LINE_COMMENT) {
                masked.append(current == '\n' ? '\n' : ' ');
                if (current == '\n') {
                    state = State.NORMAL;
                }
                continue;
            }

            if (state == State.BLOCK_COMMENT) {
                masked.append(current == '\n' ? '\n' : ' ');
                if (current == '/' && next == '*') {
                    masked.append(' ');
                    i++;
                    blockDepth++;
                } else if (current == '*' && next == '/') {
                    masked.append(' ');
                    i++;
                    blockDepth--;
                    if (blockDepth == 0) {
                        state = State.NORMAL;
                    }
                }
                continue;
            }

            if (state == State.DOLLAR_QUOTE) {
                if (sql.startsWith(dollarDelimiter, i)) {
                    masked.append(" ".repeat(dollarDelimiter.length()));
                    i += dollarDelimiter.length() - 1;
                    state = State.NORMAL;
                    dollarDelimiter = null;
                } else {
                    masked.append(current == '\n' ? '\n' : ' ');
                }
            }
        }

        if (state != State.NORMAL && state != State.LINE_COMMENT) {
            throw invalid("닫히지 않은 문자열, 식별자 또는 주석이 있습니다.");
        }
        return masked.toString();
    }

    private String dollarDelimiterAt(String sql, int start) {
        int end = sql.indexOf('$', start + 1);
        if (end < 0) {
            return null;
        }
        String tag = sql.substring(start + 1, end);
        if (!tag.isEmpty() && !tag.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            return null;
        }
        return sql.substring(start, end + 1);
    }

    private ApiProblem invalid(String message) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, message);
    }

    private enum State {
        NORMAL,
        SINGLE_QUOTE,
        DOUBLE_QUOTE,
        LINE_COMMENT,
        BLOCK_COMMENT,
        DOLLAR_QUOTE
    }
}
