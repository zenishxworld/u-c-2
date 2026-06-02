import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import { createOrder, verifyPayment } from "@/services/payment.js";

// ── Razorpay global type declaration ────────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => {
      open: () => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}


/**
 * RazorpayButton
 *
 * Props:
 *  amount        – paise (100 = ₹1). Default 100.
 *  label         – button text. Default "Pay Now".
 *  description   – shown in Razorpay modal.
 *  notes         – object passed to backend as notes.
 *  receipt       – optional receipt string.
 *  paymentType   – payment category sent to backend (e.g. APPLICATION_FEE, AI_TOOLS).
 *  onSuccess(paymentData) – called after server verification passes.
 *  onFailure(error)        – called on any failure.
 *  className     – extra Tailwind classes for the button.
 *  disabled      – disable button.
 */
const RazorpayButton = ({
  amount = 100,
  label = "Pay Now",
  description = "Application Fee",
  notes = {},
  receipt,
  paymentType,
  onSuccess,
  onFailure,
  className = "",
  disabled = false,
}) => {
  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    setState("loading");
    setErrorMsg("");

    try {
      // 1. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) throw new Error("Failed to load Razorpay SDK. Check your internet connection.");

      // 2. Create order on backend
      const orderData = await createOrder({ amount, currency: "INR", receipt, notes, paymentType });

      // 3. Open Razorpay checkout widget
      await new Promise((resolve, reject) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "UNI360",
          description,
          order_id: orderData.orderId,
          prefill: {},
          theme: { color: "#2563EB" },
          modal: {
            ondismiss: () => {
              setState("idle");
              reject(new Error("Payment cancelled by user."));
            },
          },
          handler: async (response) => {
            try {
              // 4. Verify signature on backend
              const verified = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (!verified) throw new Error("Payment signature verification failed.");

              setState("success");
              resolve(response);
              onSuccess?.({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
            } catch (err) {
              setState("error");
              setErrorMsg(err.message);
              reject(err);
              onFailure?.(err);
            }
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (response) => {
          const msg = response?.error?.description || "Payment failed.";
          setState("error");
          setErrorMsg(msg);
          reject(new Error(msg));
          onFailure?.(new Error(msg));
        });
        rzp.open();
      });
    } catch (err) {
      if (err.message !== "Payment cancelled by user.") {
        setState("error");
        setErrorMsg(err.message || "Payment error.");
        onFailure?.(err);
      }
    }
  };

  if (state === "success") {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        Payment Verified!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        disabled={disabled || state === "loading"}
        className={className}
        onClick={handlePay}
      >
        {state === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {label}
          </>
        )}
      </Button>

      {state === "error" && errorMsg && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="w-3 h-3" />
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default RazorpayButton;
