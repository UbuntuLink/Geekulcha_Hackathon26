package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.ReviewPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ReviewPhotoRepository extends JpaRepository<ReviewPhoto, Long> {

    /** Photo ids per review, without loading the image bytes — for listing reviews on a profile. */
    @Query("select p.review.id as reviewId, p.id as photoId from ReviewPhoto p "
            + "where p.review.id in :reviewIds order by p.review.id, p.position")
    List<PhotoRef> findRefsByReviewIds(@Param("reviewIds") Collection<Long> reviewIds);

    interface PhotoRef {
        long getReviewId();

        long getPhotoId();
    }
}
