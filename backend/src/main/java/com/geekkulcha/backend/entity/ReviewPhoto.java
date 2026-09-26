package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A photo a customer attached to a {@link Review}, e.g. of the finished work.
 *
 * Stored in its own table and served by id from GET /api/review-photos/{id}, rather than inlined
 * in review JSON: a provider's profile lists every review, and a few hundred KB per photo would
 * make that one response megabytes. Review deliberately has no collection back to these, so
 * serialising a Review or Booking never touches the image bytes.
 */
@Entity
@Table(name = "review_photo")
@Getter
@Setter
@NoArgsConstructor
public class ReviewPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Review review;

    /** Display order within the review, from 0. */
    private int position;

    /** image/jpeg, image/png or image/webp — checked against the bytes on upload. */
    @Column(nullable = false, length = 32)
    private String contentType;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;
}
