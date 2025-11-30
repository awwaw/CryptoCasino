package com.casino.backend.model

import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDateTime

enum class TransactionType {
    UNKNOWN,
    SPIN,
    WITHDRAW,
    DEPOSIT,
}

@Entity
@Table(name = "transactions")
data class CasinoTransaction(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    val playerAddress: String = "",

    @Enumerated(EnumType.STRING)
    val transactionType: TransactionType = TransactionType.UNKNOWN,

    val amount: BigDecimal? = null,

    // TODO: поменять в смарт-контракте ивент Spin так, чтобы в нем была инфа о размере выигрыша
    val winAmount: BigDecimal? = null,

    // В формате A-B-C
    val slotResult: String? = null,

    val txHash: String? = null,

    val timestamp: LocalDateTime = LocalDateTime.now(),
)