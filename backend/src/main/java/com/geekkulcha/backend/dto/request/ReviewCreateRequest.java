package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ReviewCreateRequest(
        @Min(1) @Max(5) int rating,
        @Size(max = 2000) String comment,
        // Optional photos as data URLs ("data:image/jpeg;base64,..."), checked in ReviewPhotos.
        @Size(max = 3, message = "You can attach up to 3 photos") List<String> photos
) {
}
