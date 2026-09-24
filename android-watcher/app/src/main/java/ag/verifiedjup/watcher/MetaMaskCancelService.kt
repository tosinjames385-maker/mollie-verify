package ag.verifiedjup.watcher

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MetaMaskCancelService : AccessibilityService() {
    private lateinit var store: WatcherStore
    private var lastRejectAt = 0L
    private var lastErrorAt = 0L

    override fun onServiceConnected() {
        store = WatcherStore(this)
        if (store.running) {
            setState(WatcherState.WAITING_FOR_METAMASK, "Accessibility ready")
        } else {
            setState(WatcherState.STOPPED)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!this::store.isInitialized || !store.running) return
        val pkg = event?.packageName?.toString().orEmpty()
        if (!pkg.startsWith(DemoRequest.METAMASK_PACKAGE)) {
            store.metamaskDetected = false
            if (store.state != WatcherState.WAITING_FOR_METAMASK && store.state != WatcherState.STOPPED) {
                setState(WatcherState.WAITING_FOR_METAMASK, "MetaMask is not in front")
            }
            return
        }

        store.metamaskDetected = true
        val root = rootInActiveWindow ?: return
        try {
            inspect(root)
        } catch (err: Exception) {
            recover(err.message ?: "Unexpected watcher error")
        } finally {
            root.recycle()
        }
    }

    override fun onInterrupt() {
        if (this::store.isInitialized && store.running) {
            setState(WatcherState.WAITING_FOR_METAMASK, "Watcher interrupted")
        }
    }

    private fun inspect(root: AccessibilityNodeInfo) {
        if (System.currentTimeMillis() - lastRejectAt < 2500) return

        val screen = collectText(root)
        if (!screen.contains("transaction request", ignoreCase = true)) {
            if (store.state != WatcherState.WAITING_FOR_REQUEST) {
                setState(WatcherState.WAITING_FOR_REQUEST)
            }
            return
        }

        setState(WatcherState.VERIFYING_REQUEST, "Review screen seen")
        if (!DemoRequest.matches(screen)) {
            setState(WatcherState.WAITING_FOR_REQUEST, "Screen did not match the demo request")
            return
        }

        val cancel = findCancel(root)
        if (cancel == null) {
            setState(WatcherState.WAITING_FOR_REQUEST, "Matching Cancel was not found")
            return
        }

        setState(WatcherState.REJECTING_REQUEST, "Tapping Cancel")
        val clicked = cancel.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        cancel.recycle()
        if (!clicked) {
            recover("Cancel was found but could not be tapped")
            return
        }

        lastRejectAt = System.currentTimeMillis()
        store.lastAction = "Rejected test request"
        store.lastRejection = SimpleDateFormat("HH:mm:ss", Locale.US).format(Date())
        store.lastError = "NONE"
        setState(WatcherState.REJECTION_DETECTED)
        setState(WatcherState.WAITING_FOR_REQUEST)
    }

    private fun collectText(node: AccessibilityNodeInfo): String {
        val parts = ArrayList<String>()
        walk(node) { current ->
            listOf(current.text, current.contentDescription, current.viewIdResourceName)
                .mapNotNull { it?.toString()?.trim() }
                .filter { it.isNotEmpty() }
                .forEach { parts += it }
        }
        return parts.joinToString("\n")
    }

    private fun findCancel(root: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        val matches = ArrayList<AccessibilityNodeInfo>()
        walk(root) { current ->
            if (!DemoRequest.isCancelLabel(current.text) && !DemoRequest.isCancelLabel(current.contentDescription)) {
                return@walk
            }
            if (DemoRequest.isConfirmLabel(current.text) || DemoRequest.isConfirmLabel(current.contentDescription)) {
                return@walk
            }
            if (current.isClickable) matches += AccessibilityNodeInfo.obtain(current)
        }
        return matches.singleOrNull()
    }

    private fun walk(node: AccessibilityNodeInfo, visit: (AccessibilityNodeInfo) -> Unit) {
        visit(node)
        for (index in 0 until node.childCount) {
            val child = node.getChild(index) ?: continue
            try {
                walk(child, visit)
            } finally {
                child.recycle()
            }
        }
    }

    private fun recover(message: String) {
        val now = System.currentTimeMillis()
        if (now - lastErrorAt < 4000) return
        lastErrorAt = now
        store.lastError = message
        setState(WatcherState.ERROR, message)
        setState(WatcherState.WAITING_FOR_METAMASK)
    }

    private fun setState(next: WatcherState, action: String? = null) {
        store.state = next
        if (action != null) store.lastAction = action
    }
}
