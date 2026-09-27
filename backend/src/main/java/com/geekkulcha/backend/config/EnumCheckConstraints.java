package com.geekkulcha.backend.config;

import com.geekkulcha.backend.entity.BookingStatus;
import com.geekkulcha.backend.entity.PaymentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Keeps the database's allowed-values checks in step with our enums.
 *
 * When Hibernate creates a table it adds a CHECK constraint listing the enum's values at that
 * moment, and ddl-auto=update never changes it afterwards. So adding a value (AWAITING_PAYMENT,
 * PAID) made every insert of it fail with "violates check constraint". This rebuilds those checks
 * from the current enums on every startup — on Render too, with no manual SQL.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class EnumCheckConstraints implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    private record EnumColumn(String table, String column, Class<? extends Enum<?>> type) {
    }

    private static final List<EnumColumn> COLUMNS = List.of(
            new EnumColumn("booking", "status", BookingStatus.class),
            new EnumColumn("booking_status_event", "status", BookingStatus.class),
            new EnumColumn("payment", "status", PaymentStatus.class)
    );

    @Override
    public void run(ApplicationArguments args) {
        for (EnumColumn c : COLUMNS) {
            String name = c.table() + "_" + c.column() + "_check";
            String values = Arrays.stream(c.type().getEnumConstants())
                    .map(e -> "'" + ((Enum<?>) e).name() + "'")
                    .collect(Collectors.joining(", "));
            try {
                jdbc.execute("alter table " + c.table() + " drop constraint if exists " + name);
                jdbc.execute("alter table " + c.table() + " add constraint " + name
                        + " check (" + c.column() + " in (" + values + "))");
            } catch (Exception e) {
                // Table not created yet, or a database without these checks: nothing to fix.
                log.warn("Couldn't refresh {}: {}", name, e.getMessage());
            }
        }
    }
}
