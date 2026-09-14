package com.bam.review.config;

import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "lab")
public class LabProperties {
    private Path catalogPath = Path.of("exercises.json");
    private Path sqlDirectory = Path.of("sql");
    private final Database database = new Database();

    public Path getCatalogPath() {
        return catalogPath;
    }

    public void setCatalogPath(Path catalogPath) {
        this.catalogPath = catalogPath;
    }

    public Path getSqlDirectory() {
        return sqlDirectory;
    }

    public void setSqlDirectory(Path sqlDirectory) {
        this.sqlDirectory = sqlDirectory;
    }

    public Database getDatabase() {
        return database;
    }

    public static class Database {
        private String url = "";
        private String user = "";
        private String password = "";

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getUser() {
            return user;
        }

        public void setUser(String user) {
            this.user = user;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
