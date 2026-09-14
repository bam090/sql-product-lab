package com.bam.review.service;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

import com.bam.review.config.LabProperties;
import com.bam.review.controller.ApiProblem;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class DatabaseQueryService {
    private static final int RESULT_LIMIT = 200;
    private static final int JDBC_MAX_ROWS = RESULT_LIMIT + 1;

    private final ExerciseStore exerciseStore;
    private final SqlValidator sqlValidator;
    private final LabProperties.Database database;

    public DatabaseQueryService(ExerciseStore exerciseStore, SqlValidator sqlValidator, LabProperties properties) {
        this.exerciseStore = exerciseStore;
        this.sqlValidator = sqlValidator;
        this.database = properties.getDatabase();
    }

    public QueryResult execute(String exerciseId, String sql) {
        exerciseStore.requireKnownId(exerciseId);
        sqlValidator.validateSingleSelect(sql);
        ensureConfigured();

        long startedAt = System.nanoTime();
        boolean connected = false;
        try (Connection connection = openConnection()) {
            connected = true;
            try {
                connection.setReadOnly(true);
                connection.setAutoCommit(false);
                setStatementTimeout(connection);
                QueryRows queryRows = readRows(connection, sql);
                long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
                return new QueryResult(
                        queryRows.columns(),
                        queryRows.rows(),
                        queryRows.rows().size(),
                        elapsedMs,
                        queryRows.truncated());
            } finally {
                rollbackQuietly(connection);
            }
        } catch (SQLException exception) {
            if (!connected || isConnectionFailure(exception)) {
                throw new ApiProblem(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "데이터베이스에 연결할 수 없습니다. config/local.properties 설정과 네트워크를 확인해 주세요.",
                        exception.getSQLState(),
                        exception);
            }
            throw new ApiProblem(
                    HttpStatus.BAD_REQUEST,
                    safeSqlMessage(exception),
                    exception.getSQLState(),
                    exception);
        }
    }

    public void checkHealth() {
        ensureConfigured();
        try (Connection connection = openConnection()) {
            try {
                connection.setReadOnly(true);
                connection.setAutoCommit(false);
                setStatementTimeout(connection);
                try (Statement statement = connection.createStatement();
                        ResultSet resultSet = statement.executeQuery("select 1")) {
                    if (!resultSet.next() || resultSet.getInt(1) != 1) {
                        throw new SQLException("health query returned an unexpected result");
                    }
                }
            } finally {
                rollbackQuietly(connection);
            }
        } catch (SQLException exception) {
            throw new ApiProblem(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "데이터베이스 연결 확인에 실패했습니다.",
                    exception.getSQLState(),
                    exception);
        }
    }

    private Connection openConnection() throws SQLException {
        Properties connectionProperties = new Properties();
        connectionProperties.setProperty("user", database.getUser().strip());
        connectionProperties.setProperty("password", database.getPassword());
        connectionProperties.setProperty("sslmode", "require");
        connectionProperties.setProperty("connectTimeout", "5");
        connectionProperties.setProperty("ApplicationName", "sql-product-lab");
        return DriverManager.getConnection(enforcedJdbcUrl(database.getUrl()), connectionProperties);
    }

    String enforcedJdbcUrl(String configuredUrl) {
        String url = configuredUrl.strip();
        if (!url.startsWith("jdbc:postgresql://")) {
            throw new ApiProblem(HttpStatus.SERVICE_UNAVAILABLE, "PostgreSQL JDBC URL 설정을 확인해 주세요.");
        }

        int queryStart = url.indexOf('?');
        String base = queryStart < 0 ? url : url.substring(0, queryStart);
        List<String> keptParameters = new ArrayList<>();
        if (queryStart >= 0 && queryStart + 1 < url.length()) {
            for (String parameter : url.substring(queryStart + 1).split("&")) {
                String key = parameter.split("=", 2)[0].toLowerCase(Locale.ROOT);
                if (!key.equals("sslmode")
                        && !key.equals("connecttimeout")
                        && !key.equals("user")
                        && !key.equals("password")) {
                    keptParameters.add(parameter);
                }
            }
        }
        keptParameters.add("sslmode=require");
        keptParameters.add("connectTimeout=5");
        return base + "?" + String.join("&", keptParameters);
    }

    private void ensureConfigured() {
        if (database.getUrl() == null
                || database.getUrl().isBlank()
                || database.getUser() == null
                || database.getUser().isBlank()
                || database.getPassword() == null
                || database.getPassword().isBlank()) {
            throw new ApiProblem(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "데이터베이스 연결 설정이 없습니다. config/local.properties를 작성해 주세요.");
        }
    }

    private void setStatementTimeout(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(3);
            statement.execute("set local statement_timeout = '3s'");
        }
    }

    private QueryRows readRows(Connection connection, String sql) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.setQueryTimeout(3);
            statement.setMaxRows(JDBC_MAX_ROWS);
            if (!statement.execute(sql)) {
                throw new ApiProblem(HttpStatus.BAD_REQUEST, "SELECT 결과를 반환하는 SQL만 실행할 수 있습니다.");
            }

            try (ResultSet resultSet = statement.getResultSet()) {
                ResultSetMetaData metadata = resultSet.getMetaData();
                List<String> columns = new ArrayList<>(metadata.getColumnCount());
                for (int index = 1; index <= metadata.getColumnCount(); index++) {
                    columns.add(metadata.getColumnLabel(index));
                }

                List<List<Object>> rows = new ArrayList<>();
                boolean truncated = false;
                while (resultSet.next()) {
                    if (rows.size() == RESULT_LIMIT) {
                        truncated = true;
                        break;
                    }
                    List<Object> row = new ArrayList<>(metadata.getColumnCount());
                    for (int index = 1; index <= metadata.getColumnCount(); index++) {
                        row.add(jsonValue(resultSet.getObject(index)));
                    }
                    rows.add(row);
                }
                return new QueryRows(columns, rows, truncated);
            }
        }
    }

    private Object jsonValue(Object value) {
        return switch (value) {
            case null -> null;
            case Timestamp timestamp -> timestamp.toLocalDateTime().toString();
            case Date date -> date.toLocalDate().toString();
            case Time time -> time.toLocalTime().toString();
            case BigDecimal decimal -> decimal;
            case Number number -> number;
            case Boolean bool -> bool;
            case String text -> text;
            default -> value.toString();
        };
    }

    private boolean isConnectionFailure(SQLException exception) {
        String state = exception.getSQLState();
        return state == null || state.startsWith("08");
    }

    private String safeSqlMessage(SQLException exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return "SQL을 실행할 수 없습니다.";
        }
        for (String secret : List.of(database.getUrl(), database.getUser(), database.getPassword())) {
            if (secret != null && !secret.isBlank()) {
                message = message.replace(secret, "[숨김]");
            }
        }
        return message.length() <= 800 ? message : message.substring(0, 800);
    }

    private void rollbackQuietly(Connection connection) {
        try {
            connection.rollback();
        } catch (SQLException ignored) {
            // The original result or exception remains the useful outcome.
        }
    }

    public record QueryResult(
            List<String> columns,
            List<List<Object>> rows,
            int rowCount,
            long elapsedMs,
            boolean truncated) {}

    private record QueryRows(List<String> columns, List<List<Object>> rows, boolean truncated) {}
}
