package com.bam.review;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {
    @Autowired
    MockMvc mockMvc;

    @Test
    void returnsRootCatalogForAllowedLoopbackHost() throws Exception {
        mockMvc.perform(get("/api/exercises").header(HttpHeaders.HOST, "127.0.0.1:8094"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.schema.table").value("products"))
                .andExpect(jsonPath("$.exercises").isArray());
    }

    @Test
    void reportsMissingDatabaseConfigurationAsServiceUnavailable() throws Exception {
        mockMvc.perform(get("/api/health").header(HttpHeaders.HOST, "localhost:8094"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("데이터베이스 연결 설정이 없습니다. config/local.properties를 작성해 주세요."));
    }

    @Test
    void blocksForeignHostAndOrigin() throws Exception {
        mockMvc.perform(get("/api/exercises").header(HttpHeaders.HOST, "evil.example"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/exercises")
                        .header(HttpHeaders.HOST, "localhost:8094")
                        .header(HttpHeaders.ORIGIN, "https://evil.example"))
                .andExpect(status().isForbidden());
    }

    @Test
    void requiresJsonForPostRequests() throws Exception {
        mockMvc.perform(post("/api/query")
                        .header(HttpHeaders.HOST, "localhost:8094")
                        .content("exerciseId=S1"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }
}
