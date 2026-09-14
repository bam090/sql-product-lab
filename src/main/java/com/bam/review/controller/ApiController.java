package com.bam.review.controller;

import com.bam.review.service.DatabaseQueryService;
import com.bam.review.service.ExerciseStore;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final ExerciseStore exerciseStore;
    private final DatabaseQueryService databaseQueryService;

    public ApiController(ExerciseStore exerciseStore, DatabaseQueryService databaseQueryService) {
        this.exerciseStore = exerciseStore;
        this.databaseQueryService = databaseQueryService;
    }

    @GetMapping("/exercises")
    public JsonNode exercises() {
        return exerciseStore.readCatalog();
    }

    @GetMapping("/sql/{id}")
    public SqlResponse sql(@PathVariable String id) {
        return new SqlResponse(exerciseStore.readSql(id));
    }

    @PostMapping(value = "/sql/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public SqlResponse saveSql(@PathVariable String id, @RequestBody SqlRequest request) {
        if (request == null) {
            throw new ApiProblem(org.springframework.http.HttpStatus.BAD_REQUEST, "요청 본문이 필요합니다.");
        }
        exerciseStore.saveSql(id, request.sql());
        return new SqlResponse(request.sql());
    }

    @PostMapping(value = "/query", consumes = MediaType.APPLICATION_JSON_VALUE)
    public DatabaseQueryService.QueryResult query(@RequestBody QueryRequest request) {
        if (request == null || request.exerciseId() == null) {
            throw new ApiProblem(org.springframework.http.HttpStatus.BAD_REQUEST, "exerciseId와 sql 값이 필요합니다.");
        }
        return databaseQueryService.execute(request.exerciseId(), request.sql());
    }

    @GetMapping("/health")
    public HealthResponse health() {
        databaseQueryService.checkHealth();
        return new HealthResponse("ok");
    }

    public record SqlRequest(String sql) {}

    public record SqlResponse(String sql) {}

    public record QueryRequest(String exerciseId, String sql) {}

    public record HealthResponse(String status) {}
}
