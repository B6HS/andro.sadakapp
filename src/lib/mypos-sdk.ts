/**
 * myPOS Smart SDK Bridge
 * 
 * Détecte si l'app tourne sur un terminal myPOS et utilise le SDK natif.
 * Sinon, utilise une simulation pour le développement/test.
 * 
 * Sur un vrai terminal myPOS, le SDK est exposé via l'interface JavaScript
 * du WebView Android (window.Android ou window.myPOS).
 */

declare global {
  interface Window {
    Android?: {
      purchase: (amount: string, reference: string, currency: string) => void;
      printReceipt: (data: string) => void;
    };
    myPOS?: {
      purchase: (amount: string, reference: string, currency: string) => void;
      printReceipt: (data: string) => void;
    };
    onMyPOSResult?: (result: string) => void;
  }
}

interface PaymentResult {
  status: "approved" | "declined";
  authCode?: string;
  ref?: string;
  amount?: string;
  reason?: string;
}

// Détecte si on est sur un vrai terminal myPOS
export function isMyPOSDevice(): boolean {
  return !!(window.Android || window.myPOS);
}

// Résolution de la promesse de paiement en cours
let pendingResolve: ((result: PaymentResult) => void) | null = null;
let pendingReject: ((result: PaymentResult) => void) | null = null;

// Callback global que le SDK natif appellera
window.onMyPOSResult = (resultJson: string) => {
  try {
    const result = JSON.parse(resultJson);
    if (result.status === "approved" && pendingResolve) {
      pendingResolve(result);
    } else if (pendingReject) {
      pendingReject(result);
    }
  } catch (e) {
    if (pendingReject) {
      pendingReject({ status: "declined", reason: "Erreur de communication avec le terminal" });
    }
  }
  pendingResolve = null;
  pendingReject = null;
};

export const MyPOSSmartSDK = {
  purchase: (amount: string, reference: string, currency: string = "EUR"): Promise<PaymentResult> => {
    const bridge = window.Android || window.myPOS;

    if (bridge) {
      // Vrai terminal myPOS
      return new Promise((resolve, reject) => {
        pendingResolve = resolve;
        pendingReject = reject;
        bridge.purchase(amount, reference, currency);

        // Timeout de sécurité (2 minutes)
        setTimeout(() => {
          if (pendingResolve) {
            pendingReject?.({ status: "declined", reason: "Délai d'attente dépassé" });
            pendingResolve = null;
            pendingReject = null;
          }
        }, 120000);
      });
    } else {
      // Simulation pour le développement
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          Math.random() > 0.1
            ? resolve({
                status: "approved",
                authCode: "SDK" + Math.floor(Math.random() * 99999),
                ref: reference,
                amount,
              })
            : reject({
                status: "declined",
                reason: "Transaction refusée par la banque",
              });
        }, 3200)
      );
    }
  },

  printReceipt: (data?: string): Promise<void> => {
    const bridge = window.Android || window.myPOS;
    if (bridge) {
      bridge.printReceipt(data || "");
      return Promise.resolve();
    }
    return new Promise((r) => setTimeout(r, 1000));
  },

  sendEmail: (): Promise<void> => {
    return new Promise((r) => setTimeout(r, 600));
  },

  sendSMS: (): Promise<void> => {
    return new Promise((r) => setTimeout(r, 600));
  },
};

export default MyPOSSmartSDK;
