package ag.verifiedjup.watcher

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action.orEmpty()
        if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_LOCKED_BOOT_COMPLETED) return
        val store = WatcherStore(context)
        if (!store.running) return
        store.state = WatcherState.STARTING
        ContextCompat.startForegroundService(context, Intent(context, WatcherForegroundService::class.java))
    }
}
