package com.amagen.ems.config;

import com.amagen.ems.util.TimeProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;

import java.util.Optional;

@Configuration
public class MongoConfig {

    @Bean(name = "dateTimeProvider")
    public DateTimeProvider dateTimeProvider(TimeProvider timeProvider) {
        return () -> Optional.of(timeProvider.now());
    }
}
