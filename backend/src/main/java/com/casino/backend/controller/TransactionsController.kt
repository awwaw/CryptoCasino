package com.casino.backend.controller

import com.casino.backend.model.CasinoTransaction
import com.casino.backend.repository.TransactionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = ["*"])
class TransactionsController(
    private val transactionRepository: TransactionRepository,
) {
    @GetMapping
    fun getAllTransactions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
    ): Page<CasinoTransaction> {
        val pageable = PageRequest.of(
            page,
            size,
            Sort.by(Sort.Direction.DESC, "id")
        )

        return transactionRepository.findAll(pageable)
    }
}