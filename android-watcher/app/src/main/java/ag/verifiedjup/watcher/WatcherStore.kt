package ag.verifiedjup.watcher

import android.content.Context
import android.content.SharedPreferences

class WatcherStore(context: Context) {
    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("cancel_watcher", Context.MODE_PRIVATE)

    var running: Boolean
        get() = prefs.getBoolean("running", false)
        set(value) { prefs.edit().putBoolean("running", value).apply() }

    var state: WatcherState
        get() = WatcherState.entries.find { it.name == prefs.getString("state", WatcherState.STOPPED.name) }
            ?: WatcherState.STOPPED
        set(value) { prefs.edit().putString("state", value.name).apply() }

    var metamaskDetected: Boolean
        get() = prefs.getBoolean("metamask", false)
        set(value) { prefs.edit().putBoolean("metamask", value).apply() }

    var lastAction: String
        get() = prefs.getString("lastAction", "NONE").orEmpty()
        set(value) { prefs.edit().putString("lastAction", value).apply() }

    var lastRejection: String
        get() = prefs.getString("lastRejection", "NONE").orEmpty()
        set(value) { prefs.edit().putString("lastRejection", value).apply() }

    var lastError: String
        get() = prefs.getString("lastError", "NONE").orEmpty()
        set(value) { prefs.edit().putString("lastError", value).apply() }

    fun snapshot(): String = buildString {
        appendLine("Automation: ${if (running) "RUNNING" else "STOPPED"}")
        appendLine("MetaMask: ${if (metamaskDetected) "DETECTED" else "NOT DETECTED"}")
        appendLine("Current state: $state")
        appendLine("Last action: $lastAction")
        appendLine("Last rejection: $lastRejection")
        appendLine("Last error: $lastError")
    }
}
