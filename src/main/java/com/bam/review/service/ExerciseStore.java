package com.bam.review.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.HashSet;
import java.util.Set;

import com.bam.review.config.LabProperties;
import com.bam.review.controller.ApiProblem;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class ExerciseStore {
    public static final int MAX_SQL_BYTES = 16 * 1024;

    private final ObjectMapper objectMapper;
    private final Path catalogPath;
    private final Path sqlDirectory;

    public ExerciseStore(ObjectMapper objectMapper, LabProperties properties) {
        this.objectMapper = objectMapper;
        this.catalogPath = properties.getCatalogPath().toAbsolutePath().normalize();
        this.sqlDirectory = properties.getSqlDirectory().toAbsolutePath().normalize();
    }

    public JsonNode readCatalog() {
        try {
            JsonNode root = objectMapper.readTree(catalogPath.toFile());
            if (!root.isObject() || !root.path("exercises").isArray()) {
                throw new IOException("catalog root or exercises is invalid");
            }
            return root;
        } catch (IOException exception) {
            throw new ApiProblem(HttpStatus.SERVICE_UNAVAILABLE, "연습 문제 목록을 읽을 수 없습니다.", null, exception);
        }
    }

    public String readSql(String id) {
        requireKnownId(id);
        Path target = safeSqlPath(id);
        if (Files.isSymbolicLink(target)) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "허용되지 않은 SQL 파일 경로입니다.");
        }
        try {
            return Files.exists(target) ? Files.readString(target, StandardCharsets.UTF_8) : "";
        } catch (IOException exception) {
            throw new ApiProblem(HttpStatus.SERVICE_UNAVAILABLE, "SQL 파일을 읽을 수 없습니다.", null, exception);
        }
    }

    public void saveSql(String id, String sql) {
        requireKnownId(id);
        if (sql == null) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "sql 값이 필요합니다.");
        }
        if (sql.getBytes(StandardCharsets.UTF_8).length > MAX_SQL_BYTES) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "SQL은 16KB 이하로 작성해 주세요.");
        }

        Path target = safeSqlPath(id);
        if (Files.isSymbolicLink(target)) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "허용되지 않은 SQL 파일 경로입니다.");
        }

        Path temporary = null;
        try {
            Files.createDirectories(sqlDirectory);
            temporary = Files.createTempFile(sqlDirectory, id + ".", ".tmp");
            Files.writeString(temporary, sql, StandardCharsets.UTF_8);
            Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException exception) {
            throw new ApiProblem(HttpStatus.SERVICE_UNAVAILABLE, "이 파일 시스템에서는 안전하게 저장할 수 없습니다.", null, exception);
        } catch (IOException exception) {
            throw new ApiProblem(HttpStatus.SERVICE_UNAVAILABLE, "SQL 파일을 저장할 수 없습니다.", null, exception);
        } finally {
            if (temporary != null) {
                try {
                    Files.deleteIfExists(temporary);
                } catch (IOException ignored) {
                    // The target move already succeeded or the operating system will clean up the temp file.
                }
            }
        }
    }

    public void requireKnownId(String id) {
        if (id == null || id.isBlank() || !knownIds().contains(id)) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "알 수 없는 연습 문제 ID입니다.");
        }
    }

    private Set<String> knownIds() {
        Set<String> ids = new HashSet<>();
        for (JsonNode exercise : readCatalog().path("exercises")) {
            JsonNode id = exercise.get("id");
            if (id != null && id.isTextual()) {
                ids.add(id.textValue());
            }
        }
        return ids;
    }

    private Path safeSqlPath(String id) {
        Path target = sqlDirectory.resolve(id + ".sql").normalize();
        if (!target.getParent().equals(sqlDirectory)) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "허용되지 않은 SQL 파일 경로입니다.");
        }
        return target;
    }
}
