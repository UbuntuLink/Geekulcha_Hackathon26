package com.geekkulcha.backend.dto.response;

import java.util.List;

public record QuantumOptimisationResponse(
        List<QuantumAssignment> assignments,
        String algorithm
) {}
