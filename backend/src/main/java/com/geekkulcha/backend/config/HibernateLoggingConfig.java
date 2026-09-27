package com.geekkulcha.backend.config;

import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Never print SQL. show_sql writes every query to the log; on Render that buried the startup
 * log under thousands of lines. Applied last, so an environment variable such as
 * SPRING_JPA_SHOW_SQL=true on a hosting dashboard can't turn it back on.
 */
@Configuration
public class HibernateLoggingConfig {

    @Bean
    public HibernatePropertiesCustomizer disableSqlLogging() {
        return properties -> {
            properties.put("hibernate.show_sql", "false");
            properties.put("hibernate.format_sql", "false");
        };
    }
}
