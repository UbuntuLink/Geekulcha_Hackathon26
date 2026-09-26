package com.geekkulcha.backend.util;

import java.util.Base64;

/**
 * Turns an uploaded review photo (a browser data URL) into checked image bytes.
 *
 * The declared type is not trusted: the bytes must start with the JPEG, PNG or WebP signature and
 * match what the data URL claims. That keeps anything that isn't a plain raster image — SVG with
 * script in it, HTML, executables renamed .jpg — out of storage, so serving the bytes back from
 * GET /api/review-photos/{id} can't become a way to deliver content to other users.
 */
public final class ReviewPhotos {

    /** Per photo, after decoding. The frontend resizes to ~1280px JPEG, typically 150–300 KB. */
    public static final int MAX_BYTES = 2 * 1024 * 1024;

    private ReviewPhotos() {
    }

    public record Image(String contentType, byte[] data) {
    }

    /** @throws IllegalArgumentException with a message fit to show the customer */
    public static Image decode(String dataUrl) {
        if (dataUrl == null || !dataUrl.startsWith("data:") || !dataUrl.contains(";base64,")) {
            throw new IllegalArgumentException("One of the photos couldn't be read. Please choose it again.");
        }

        String declaredType = dataUrl.substring(5, dataUrl.indexOf(';'));
        byte[] data;
        try {
            data = Base64.getDecoder().decode(dataUrl.substring(dataUrl.indexOf(";base64,") + 8));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("One of the photos couldn't be read. Please choose it again.");
        }

        if (data.length == 0) {
            throw new IllegalArgumentException("One of the photos is empty.");
        }
        if (data.length > MAX_BYTES) {
            throw new IllegalArgumentException("Each photo must be under 2 MB.");
        }

        String actualType = sniff(data);
        if (actualType == null || !actualType.equals(declaredType)) {
            throw new IllegalArgumentException("Photos must be JPEG, PNG or WebP images.");
        }
        return new Image(actualType, data);
    }

    private static String sniff(byte[] d) {
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G'
                && d[4] == 0x0D && d[5] == 0x0A && d[6] == 0x1A && d[7] == 0x0A) {
            return "image/png";
        }
        if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return "image/webp";
        }
        return null;
    }
}
