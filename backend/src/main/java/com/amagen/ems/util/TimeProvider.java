package com.amagen.ems.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
public class TimeProvider {

    private final ZoneId zoneId;

    public TimeProvider(@Value("${app.timezone}") String timezone) {
        this.zoneId = ZoneId.of(timezone);
    }

    public LocalDateTime now() {
        return LocalDateTime.now(zoneId).truncatedTo(java.time.temporal.ChronoUnit.SECONDS);
    }

    public LocalDate today() {
        return LocalDate.now(zoneId);
    }

    public ZoneId getZoneId() {
        return zoneId;
    }
}
