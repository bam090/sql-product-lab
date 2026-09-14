package com.bam.review.controller;

import org.springframework.http.HttpStatus;

public class ApiProblem extends RuntimeException {
    private final HttpStatus status;
    private final String sqlState;

    public ApiProblem(HttpStatus status, String message) {
        this(status, message, null, null);
    }

    public ApiProblem(HttpStatus status, String message, String sqlState, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.sqlState = sqlState;
    }

    public HttpStatus status() {
        return status;
    }

    public String sqlState() {
        return sqlState;
    }
}
