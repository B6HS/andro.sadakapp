package app.sadaq.android;

import android.webkit.JavascriptInterface;
import android.util.Log;

import com.mypos.smartsdk.MyPOSAPI;
import com.mypos.smartsdk.MyPOSPayment;
import com.mypos.smartsdk.print.PrinterCommand;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * MyPOSBridge — Pont JavaScript ↔ SDK natif myPOS Smart
 *
 * Exposé via WebView.addJavascriptInterface() sous le nom "Android".
 * L'app web peut appeler :
 *   - Android.purchase(amount, reference, currency)
 *   - Android.printReceipt(data)
 */
public class MyPOSBridge {

    private static final String TAG = "MyPOSBridge";
    private final MainActivity activity;

    public MyPOSBridge(MainActivity activity) {
        this.activity = activity;
    }

    /**
     * Déclenche un paiement par carte via le terminal myPOS.
     *
     * @param amount    Montant en format string (ex: "10.00")
     * @param reference Référence unique de la transaction
     * @param currency  Code devise ISO (ex: "EUR")
     */
    @JavascriptInterface
    public void purchase(String amount, String reference, String currency) {
        Log.d(TAG, "purchase() called: " + amount + " " + currency + " ref=" + reference);

        try {
            MyPOSPayment payment = MyPOSPayment.builder()
                .productAmount(Double.parseDouble(amount))
                .currency(com.mypos.smartsdk.Currency.EUR)
                .foreignTransactionId(reference)
                .build();

            // Lance l'activité de paiement myPOS
            MyPOSAPI.openPaymentActivity(activity, payment, 1001);

        } catch (Exception e) {
            Log.e(TAG, "Payment error", e);
            sendError("Erreur lors du lancement du paiement: " + e.getMessage());
        }
    }

    /**
     * Imprime un reçu via l'imprimante intégrée du terminal myPOS.
     *
     * @param data Données du reçu au format texte
     */
    @JavascriptInterface
    public void printReceipt(String data) {
        Log.d(TAG, "printReceipt() called");

        try {
            List<PrinterCommand> commands = new ArrayList<>();

            // En-tête
            commands.add(new PrinterCommand(PrinterCommand.CommandType.TEXT,
                "\n========== REÇU ==========\n"));

            // Contenu
            if (data != null && !data.isEmpty()) {
                commands.add(new PrinterCommand(PrinterCommand.CommandType.TEXT, data));
            }

            // Pied de page
            commands.add(new PrinterCommand(PrinterCommand.CommandType.TEXT,
                "\n===========================\n"));
            commands.add(new PrinterCommand(PrinterCommand.CommandType.TEXT,
                "      Merci pour votre don\n\n\n"));

            MyPOSAPI.print(activity, commands);

        } catch (Exception e) {
            Log.e(TAG, "Print error", e);
        }
    }

    /**
     * Appelé quand le résultat du paiement revient de l'activité myPOS.
     * À connecter dans MainActivity.onActivityResult()
     */
    public void handlePaymentResult(int resultCode, android.content.Intent data) {
        try {
            JSONObject result = new JSONObject();

            if (resultCode == android.app.Activity.RESULT_OK) {
                result.put("status", "approved");
                result.put("authCode", data != null ?
                    data.getStringExtra("authorization_code") : "N/A");
                result.put("ref", data != null ?
                    data.getStringExtra("foreign_transaction_id") : "");
            } else {
                result.put("status", "declined");
                result.put("reason", "Transaction refusée ou annulée");
            }

            activity.sendResultToWeb(result.toString());

        } catch (Exception e) {
            Log.e(TAG, "Result handling error", e);
            sendError("Erreur de traitement du résultat");
        }
    }

    private void sendError(String message) {
        try {
            JSONObject error = new JSONObject();
            error.put("status", "declined");
            error.put("reason", message);
            activity.sendResultToWeb(error.toString());
        } catch (Exception e) {
            Log.e(TAG, "Error sending error", e);
        }
    }
}
