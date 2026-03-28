package app.sadaq.android;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * MainActivity — WebView plein écran (myPOS). Charge BuildConfig.APP_URL
 * (ex. https://sadaq.app/android/borne).
 */
public class MainActivity extends Activity {

    private WebView webView;
    private MyPOSBridge bridge;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Mode immersif plein écran (kiosque)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        bridge = new MyPOSBridge(this);

        setupWebView();
        webView.loadUrl(BuildConfig.APP_URL);
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Expose le bridge JavaScript pour le SDK myPOS
        webView.addJavascriptInterface(bridge, "Android");
    }

    @Override
    public void onBackPressed() {
        // Désactiver le bouton retour en mode kiosque
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        // Code 1001 = paiement myPOS
        if (requestCode == 1001) {
            bridge.handlePaymentResult(resultCode, data);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Re-appliquer le mode immersif
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    /**
     * Appelé par MyPOSBridge pour envoyer un résultat au JavaScript
     */
    public void sendResultToWeb(String json) {
        runOnUiThread(() -> {
            webView.evaluateJavascript(
                "if(window.onMyPOSResult) window.onMyPOSResult('" + json.replace("'", "\\'") + "');",
                null
            );
        });
    }
}
