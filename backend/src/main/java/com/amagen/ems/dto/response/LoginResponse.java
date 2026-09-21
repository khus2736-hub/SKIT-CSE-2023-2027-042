package com.amagen.ems.dto.response;

public record LoginResponse(
    String token,
    UserResponse user
) {}
