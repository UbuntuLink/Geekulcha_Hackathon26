package com.geekkulcha.backend.dto.request;

import java.util.List;

public record QuantumOptimisationRequest (
    List<QuantumJob> jobs,
    List<QuantumProvider> providers
) {}
