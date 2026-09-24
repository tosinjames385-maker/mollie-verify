package ag.verifiedjup.watcher

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private lateinit var store: WatcherStore
    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        store = WatcherStore(this)
        statusText = findViewById(R.id.statusText)

        findViewById<Button>(R.id.startButton).setOnClickListener { startWatcher() }
        findViewById<Button>(R.id.stopButton).setOnClickListener { stopWatcher() }
        findViewById<Button>(R.id.permissionButton).setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        render()
    }

    override fun onResume() {
        super.onResume()
        render()
        statusText.postDelayed({ if (!isDestroyed) render() }, 1000)
    }

    private fun startWatcher() {
        store.running = true
        store.lastError = "NONE"
        store.state = WatcherState.STARTING
        ContextCompat.startForegroundService(this, Intent(this, WatcherForegroundService::class.java))
        if (!accessibilityEnabled()) {
            store.lastError = "Turn on Cancel Watcher in Accessibility settings"
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        } else {
            store.state = WatcherState.WAITING_FOR_METAMASK
            store.lastAction = "Watcher started"
        }
        render()
    }

    private fun stopWatcher() {
        store.running = false
        store.state = WatcherState.STOPPED
        store.lastAction = "Stopped by STOP AUTOMATION"
        stopService(Intent(this, WatcherForegroundService::class.java))
        render()
    }

    private fun accessibilityEnabled(): Boolean {
        val enabled = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES).orEmpty()
        return enabled.contains(packageName)
    }

    private fun render() {
        statusText.text = store.snapshot() +
            "\nAccessibility: ${if (accessibilityEnabled()) "ON" else "OFF"}"
    }
}
