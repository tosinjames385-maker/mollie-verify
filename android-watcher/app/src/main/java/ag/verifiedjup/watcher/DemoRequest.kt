package ag.verifiedjup.watcher

object DemoRequest {
    const val METAMASK_PACKAGE = "io.metamask"
    const val EXPECTED_AMOUNT = "0.000005 SOL"

    val REQUIRED_TEXT = listOf(
        "Transaction request",
        "Estimated changes",
        "Account",
        "Recipient",
        "Solana Mainnet",
        EXPECTED_AMOUNT,
        "Cancel",
        "Confirm",
    )

    fun compact(value: CharSequence?): String =
        value?.toString()?.replace("\\s+".toRegex(), " ")?.trim()?.lowercase().orEmpty()

    fun matches(screenText: String): Boolean {
        val flat = compact(screenText)
        return REQUIRED_TEXT.all { flat.contains(compact(it)) }
    }

    fun isCancelLabel(value: CharSequence?): Boolean = compact(value) == "cancel"

    fun isConfirmLabel(value: CharSequence?): Boolean = compact(value) == "confirm"
}
