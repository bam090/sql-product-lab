package com.bam.review.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

import com.bam.review.config.LabProperties;
import org.junit.jupiter.api.Test;

class DatabaseQueryServiceTest {
    @Test
    void forcesSslAndFiveSecondConnectionTimeout() {
        LabProperties properties = new LabProperties();
        DatabaseQueryService service = new DatabaseQueryService(
                mock(ExerciseStore.class),
                new SqlValidator(),
                properties);

        assertEquals(
                "jdbc:postgresql://db.example.test:5432/postgres?applicationName=lesson&sslmode=require&connectTimeout=5",
                service.enforcedJdbcUrl(
                        "jdbc:postgresql://db.example.test:5432/postgres?sslmode=disable&connectTimeout=99&password=bad&applicationName=lesson"));
    }
}
