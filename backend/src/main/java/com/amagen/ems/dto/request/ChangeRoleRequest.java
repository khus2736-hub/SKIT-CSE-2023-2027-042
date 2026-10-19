package com.amagen.ems.dto.request;

import com.amagen.ems.model.enums.Role;
import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(
    @NotNull(message = "Role is required") Role role
) {}
