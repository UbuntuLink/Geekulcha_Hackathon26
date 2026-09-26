package com.geekkulcha.backend.controller;

import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geekkulcha.backend.entity.ReviewPhoto;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ReviewPhotoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Serves review photos as plain images, so a page can use them in an {@code <img src>}.
 *
 * Public (see SecurityConfig): an img tag can't send the Bearer token, and these photos are shown
 * on provider profiles to every customer anyway. Photos never change once uploaded, so browsers
 * may cache them for a long time.
 */
@RestController
@RequestMapping("/api/review-photos")
@RequiredArgsConstructor
public class ReviewPhotoController {

    private final ReviewPhotoRepository reviewPhotoRepository;

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> get(@PathVariable long id) {
        ReviewPhoto photo = reviewPhotoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo " + id + " not found"));

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic().immutable())
                // Belt and braces: only raster types are ever stored, but never let a browser
                // sniff these bytes as anything else.
                .header("X-Content-Type-Options", "nosniff")
                .body(photo.getData());
    }
}
