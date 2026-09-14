package com.bam.review.config;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LoopbackApiFilter extends OncePerRequestFilter {
    private static final Set<String> ALLOWED_HOSTS = Set.of("localhost:8094", "127.0.0.1:8094");
    private static final Set<String> ALLOWED_ORIGINS = Set.of("http://localhost:8094", "http://127.0.0.1:8094");

    private final ObjectMapper objectMapper;

    public LoopbackApiFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String host = request.getHeader("Host");
        if (host == null || !ALLOWED_HOSTS.contains(host.toLowerCase())) {
            reject(response, HttpServletResponse.SC_FORBIDDEN, "허용되지 않은 Host입니다.");
            return;
        }

        String origin = request.getHeader("Origin");
        if (origin != null && !ALLOWED_ORIGINS.contains(origin.toLowerCase())) {
            reject(response, HttpServletResponse.SC_FORBIDDEN, "다른 사이트에서 보낸 API 요청은 허용되지 않습니다.");
            return;
        }

        if (request.getMethod().equals("POST") && !hasJsonContentType(request)) {
            reject(response, HttpServletResponse.SC_BAD_REQUEST, "POST 요청은 application/json 형식이어야 합니다.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean hasJsonContentType(HttpServletRequest request) {
        String contentType = request.getContentType();
        if (contentType == null) {
            return false;
        }
        try {
            return MediaType.APPLICATION_JSON.isCompatibleWith(MediaType.parseMediaType(contentType));
        } catch (IllegalArgumentException ignored) {
            return false;
        }
    }

    private void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), Map.of("message", message));
    }
}
