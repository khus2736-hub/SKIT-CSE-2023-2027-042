package com.amagen.ems.security;

import com.amagen.ems.exception.ForbiddenException;
import com.amagen.ems.model.User;
import com.amagen.ems.model.enums.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public static CustomUserDetails getCurrentUserDetails() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails;
        }
        throw new ForbiddenException("Authentication required");
    }

    public static User getCurrentUser() {
        return getCurrentUserDetails().getUser();
    }

    public static String getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public static String getCurrentUsername() {
        return getCurrentUser().getUsername();
    }

    public static Role getCurrentUserRole() {
        return getCurrentUser().getRole();
    }

    public static String getCurrentEmployeeId() {
        return getCurrentUser().getEmployeeId();
    }

    public static String requireEmployeeId() {
        String employeeId = getCurrentEmployeeId();
        if (employeeId == null || employeeId.isBlank()) {
            throw new ForbiddenException("Your account is not linked to an employee record");
        }
        return employeeId;
    }

    public static boolean isCurrentUserAdmin() {
        return getCurrentUserRole() == Role.ADMIN;
    }
}
