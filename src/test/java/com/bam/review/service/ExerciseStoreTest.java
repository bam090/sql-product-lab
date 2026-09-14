package com.bam.review.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Files;
import java.nio.file.Path;

import com.bam.review.config.LabProperties;
import com.bam.review.controller.ApiProblem;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.json.JsonMapper;

class ExerciseStoreTest {
    @TempDir
    Path temporaryDirectory;

    @Test
    void reloadsCatalogOnEveryCheckAndSavesOnlyKnownIds() throws Exception {
        Path catalog = temporaryDirectory.resolve("exercises.json");
        Path sqlDirectory = temporaryDirectory.resolve("sql");
        Files.writeString(catalog, "{\"exercises\":[{\"id\":\"S1\"}]}");

        ExerciseStore store = store(catalog, sqlDirectory);
        store.saveSql("S1", "select 1");
        assertEquals("select 1", Files.readString(sqlDirectory.resolve("S1.sql")));

        Files.writeString(catalog, "{\"exercises\":[{\"id\":\"F1\"}]}");
        assertThrows(ApiProblem.class, () -> store.readSql("S1"));
        store.saveSql("F1", "select 2");
        assertEquals("select 2", store.readSql("F1"));
    }

    @Test
    void rejectsCatalogIdThatWouldEscapeSqlDirectoryAndOversizedSql() throws Exception {
        Path catalog = temporaryDirectory.resolve("exercises.json");
        Path sqlDirectory = temporaryDirectory.resolve("sql");
        Files.writeString(catalog, "{\"exercises\":[{\"id\":\"../outside\"},{\"id\":\"S1\"}]}");
        ExerciseStore store = store(catalog, sqlDirectory);

        assertThrows(ApiProblem.class, () -> store.saveSql("../outside", "select 1"));
        assertThrows(ApiProblem.class, () -> store.saveSql("S1", "가".repeat(ExerciseStore.MAX_SQL_BYTES)));
    }

    private ExerciseStore store(Path catalog, Path sqlDirectory) {
        LabProperties properties = new LabProperties();
        properties.setCatalogPath(catalog);
        properties.setSqlDirectory(sqlDirectory);
        return new ExerciseStore(JsonMapper.builder().build(), properties);
    }
}
