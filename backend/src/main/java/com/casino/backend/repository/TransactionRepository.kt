package com.casino.backend.repository

import com.casino.backend.model.CasinoTransaction
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TransactionRepository : JpaRepository<CasinoTransaction, Long>