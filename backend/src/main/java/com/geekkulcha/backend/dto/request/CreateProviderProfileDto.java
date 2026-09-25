package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CreateProviderProfileDto {

    @NotBlank
    @Pattern(
        regexp = "\\d{13}",
        message = "South African ID must contain exactly 13 digits"
    )
    private String idNumber;

    @NotBlank
    private String bio;

    @NotBlank
    private String location;

    /** Optional coordinates from the location picker; null when the provider skipped it. */
    @DecimalMin("-90")
    @DecimalMax("90")
    private Double latitude;

    @DecimalMin("-180")
    @DecimalMax("180")
    private Double longitude;

    private Integer serviceRadiusKm;

    private boolean availableToday;

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getServiceRadiusKm() {
        return serviceRadiusKm;
    }

    public void setServiceRadiusKm(Integer serviceRadiusKm) {
        this.serviceRadiusKm = serviceRadiusKm;
    }

    public boolean isAvailableToday() {
        return availableToday;
    }

    public void setAvailableToday(boolean availableToday) {
        this.availableToday = availableToday;
    }

    public String getIdNumber() {
        return idNumber;
    }

    public void setIdNumber(String idNumber) {
        this.idNumber = idNumber;
    }
}
