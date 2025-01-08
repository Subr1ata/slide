import axios from "axios";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const useSubscription = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const onSubscribe = async () => {
    const user = await axios.get("/api/user");

    try {
      setIsProcessing(true);
      const response = await axios.get("/api/payment");
      if (response.data.status === 200) {
        const { order_id, amount, currency } = response.data;

        // Initialize Razorpay Checkout
        const options = {
          key: process.env.RAZORPAY_KEY_ID, // Razorpay key for frontend
          amount: amount,
          currency: currency,
          name: "Slide",
          description: "Subscription Payment",
          order_id: order_id,
          handler: async function (paymentResponse: any) {
            // Payment success callback
            const data = {
              orderCreationId: order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            };

            // Optionally send paymentResponse to the server for validation
            const verify = await axios.post(
              "/api/payment/verify",
              JSON.stringify(data)
            );

            // Payment verified, update user subscription status
            if (verify.data.isOk) {
              return (window.location.href = `${process.env.NEXT_PUBLIC_HOST_URL}/payment?session_id=${data.razorpayPaymentId}`);
            }
          },
          prefill: {
            name: user.data.fullName, // Replace with user data
            email: user.data.emailAddresses[0].emailAddress, // Replace with user data
          },
          theme: {
            color: "#3399cc", // Customize the Razorpay checkout theme color
          },
        };

        const razorpay = new window.Razorpay(options); // Initialize Razorpay Checkout
        razorpay.on("payment.failed", function (response: any) {
          alert(response.error.description);
        });
        razorpay.open();
      }
    } catch (error) {
      console.log(`🔴Something went wrong, reason: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return { onSubscribe, isProcessing };
};
