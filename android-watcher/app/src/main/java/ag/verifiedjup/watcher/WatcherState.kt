package ag.verifiedjup.watcher

enum class WatcherState {
    STARTING,
    WAITING_FOR_METAMASK,
    WAITING_FOR_REQUEST,
    VERIFYING_REQUEST,
    REJECTING_REQUEST,
    REJECTION_DETECTED,
    ERROR,
    STOPPED,
}
