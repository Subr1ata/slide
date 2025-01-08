import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { CreditCardIcon, Loader2 } from "lucide-react";
import React from "react";
import Script from "next/script";

type Props = {};

const PaymentButton = (props: Props) => {
  const { onSubscribe, isProcessing } = useSubscription();
  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <Button
        disabled={isProcessing}
        onClick={onSubscribe}
        className="bg-gradient-to-br
     text-white 
     rounded-full 
    from-[#6d60a3] 
    via-[#9434E6] 
    font-bold 
    to-[#CC3BD4]"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" />
        ) : (
          <CreditCardIcon />
        )}
      </Button>
    </>
  );
};

export default PaymentButton;
