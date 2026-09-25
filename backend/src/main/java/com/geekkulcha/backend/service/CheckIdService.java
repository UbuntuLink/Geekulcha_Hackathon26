package com.geekkulcha.backend.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.geekkulcha.backend.util.SaIdNumber;

/**
 * Verifies a South African ID number, through CheckID when it is configured and offline when it
 * is not.
 *
 * Previously this always called the remote service. With no CHECKID_API_KEY the request went out
 * as "Authorization: Bearer " and failed, the exception escaped, and becoming a provider was
 * impossible for everyone — which is exactly how it behaved on every machine, since no key was
 * ever set. Neither extreme is right: blocking every applicant makes the feature dead, and
 * accepting anything makes the check theatre. So an unconfigured or unreachable service falls
 * back to the structural check (Luhn digit, real date of birth), which catches typos and invented
 * numbers without a third party.
 */
@Service
public class CheckIdService {

    private static final Logger log = LoggerFactory.getLogger(CheckIdService.class);

    private final RestClient restClient;
    private final String apiKey;

    public CheckIdService(
            @Value("${checkid.base-url}") String baseUrl,
            @Value("${checkid.api-key}") String apiKey
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.apiKey = apiKey;
    }

    public boolean validateId(String idNumber) {
        // A number that fails the checksum is wrong whatever any service says, and there is no
        // point spending a remote call on it.
        if (!SaIdNumber.isStructurallyValid(idNumber)) {
            return false;
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.info("CHECKID_API_KEY is not set — accepting ID {} on the offline structural check only",
                    maskedId(idNumber));
            return true;
        }

        try {
            Map<?, ?> response = restClient
                    .get()
                    .uri("/api/v1/validate/{idNumber}", idNumber)
                    .header("Authorization", "Bearer " + apiKey)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                log.warn("CheckID returned an empty body for {} — using the structural check", maskedId(idNumber));
                return true;
            }

            return Boolean.TRUE.equals(response.get("isValid"));
        } catch (RuntimeException e) {
            // An outage at CheckID must not stop people signing up; the number already passed
            // the checksum.
            log.warn("CheckID call failed for {} ({}) — using the structural check",
                    maskedId(idNumber), e.getMessage());
            return true;
        }
    }

    /** Never log a whole ID number: keep the birth date, hide the rest. */
    private String maskedId(String idNumber) {
        if (idNumber == null || idNumber.length() < 6) {
            return "******";
        }
        return idNumber.substring(0, 6) + "*******";
    }
}
