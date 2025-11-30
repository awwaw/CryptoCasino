package com.casino.backend.service

import com.casino.backend.model.CasinoTransaction
import com.casino.backend.model.TransactionType
import com.casino.backend.repository.TransactionRepository
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.web3j.abi.EventEncoder
import org.web3j.abi.FunctionReturnDecoder
import org.web3j.abi.TypeReference
import org.web3j.abi.datatypes.Address
import org.web3j.abi.datatypes.Event
import org.web3j.abi.datatypes.Type
import org.web3j.abi.datatypes.generated.Uint256
import org.web3j.abi.datatypes.generated.Uint8
import org.web3j.protocol.Web3j
import org.web3j.protocol.core.DefaultBlockParameterName
import org.web3j.protocol.core.methods.request.EthFilter
import org.web3j.protocol.http.HttpService
import java.math.BigDecimal
import java.time.LocalDateTime

@Service
class BlockchainListener(
    val transactionRepository: TransactionRepository,

    @param:Value($$"${web3.node-url}")
    val nodeUrl: String,

    @param:Value($$"${web3.contract-address}")
    val contractAddress: String,
) {
    private val logger = LoggerFactory.getLogger(BlockchainListener::class.java)
    private val weiDivider = BigDecimal.TEN.pow(18)

    val spinEvent = Event(
        "SpinResult",
        listOf(
            TypeReference.create(Address::class.java, true),
            TypeReference.create(Uint8::class.java),
            TypeReference.create(Uint8::class.java),
            TypeReference.create(Uint8::class.java),
            TypeReference.create(Uint256::class.java),
        )
    )

    @Suppress("UNCHECKED_CAST")
    val nonIndexedParameters: List<TypeReference<Type<*>>> = listOf(
        TypeReference.create(Uint8::class.java) as TypeReference<Type<*>>,
        TypeReference.create(Uint8::class.java) as TypeReference<Type<*>>,
        TypeReference.create(Uint8::class.java) as TypeReference<Type<*>>,
        TypeReference.create(Uint256::class.java) as TypeReference<Type<*>>,
    )

    @PostConstruct
    fun startListening() {
        logger.info("Connecting to blockchain node: $nodeUrl")

        try {
            val web3j = Web3j.build(HttpService(nodeUrl))
            val eventSignature = EventEncoder.encode(spinEvent)

            logger.info("Addr: $contractAddress")
            logger.info("Topic: $eventSignature")
            val filter = EthFilter(
                DefaultBlockParameterName.LATEST,
                DefaultBlockParameterName.LATEST,
                contractAddress,
            )
            filter.addSingleTopic(eventSignature)

            logger.info("Initialized web3j and events filter for contract address $contractAddress")

            web3j.ethLogFlowable(filter).subscribe { log ->
                logger.info("Event received. Transaction: ${log.transactionHash}")

                try {
                    val address = FunctionReturnDecoder.decodeIndexedValue(
                        log.topics[1],
                        TypeReference.create(Address::class.java)
                    ) as Address
                    val playerAddress = address.value

                    val decodedValues = FunctionReturnDecoder.decode(
                        log.data,
                        nonIndexedParameters,
                    )

                    val r1 = (decodedValues[0] as Uint8).value
                    val r2 = (decodedValues[1] as Uint8).value
                    val r3 = (decodedValues[2] as Uint8).value
                    val prizeWei = (decodedValues[3] as Uint256).value

                    val prizeEth = BigDecimal(prizeWei).divide(weiDivider)
                    val slots = "$r1-$r2-$r3"

                    val transaction = CasinoTransaction(
                        playerAddress = playerAddress,
                        transactionType = TransactionType.SPIN,
                        amount = BigDecimal.ZERO,
                        winAmount = prizeEth,
                        slotResult = slots,
                        txHash = log.transactionHash,
                        timestamp = LocalDateTime.now(),
                    )

                    transactionRepository.save(transaction)
                    logger.info("Saved transaction: Player = $playerAddress, Win = $prizeEth ETH, Slots = $slots")
                } catch (e: Exception) {
                    logger.error("Error while processing transaction logs: ${e.message}")
                }
            }
        } catch (e: Exception) {
            logger.error("Error while listening for events: ${e.message}")
        }
    }
}