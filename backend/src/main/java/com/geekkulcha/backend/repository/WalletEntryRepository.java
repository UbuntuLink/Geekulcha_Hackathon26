package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.WalletEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletEntryRepository extends JpaRepository<WalletEntry, Long> {
    List<WalletEntry> findTop100ByWallet_IdOrderByCreatedAtDesc(long walletId);

    boolean existsByWallet_Id(long walletId);
}
