"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createUser, findUser, updateSubscription } from "./queries";
import { refreshToken } from "@/lib/fetch";
import { updateIntegration } from "../integrations/queries";
import Razorpay from "razorpay";

export const onCurrentUser = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  return user;
};

export const onBoardUser = async () => {
  const user = await onCurrentUser();
  try {
    const found = await findUser(user.id);
    if (found) {
      if (found.integrations.length > 0) {
        const today = new Date();
        const time_left =
          found.integrations[0].expiresAt?.getTime()! - today.getTime();

        const days = Math.round(time_left / (1000 * 3600 * 24));
        if (days < 5) {
          console.log("refresh");

          const refresh = await refreshToken(found.integrations[0].token);

          const today = new Date();
          const expire_date = today.setDate(today.getDate() + 60);

          const update_token = await updateIntegration(
            refresh.access_token,
            new Date(expire_date),
            found.integrations[0].id
          );
          if (!update_token) {
            console.log("Update token failed");
          }
        }
      }

      return {
        status: 200,
        data: {
          firstname: found.firstname,
          lastname: found.lastname,
        },
      };
    }
    const created = await createUser(
      user.id,
      user.firstName!,
      user.lastName!,
      user.emailAddresses[0].emailAddress
    );
    return { status: 201, data: created };
  } catch (error) {
    console.log(error);
    return { status: 500 };
  }
};

export const onUserInfo = async () => {
  const user = await onCurrentUser();
  try {
    const profile = await findUser(user.id);
    if (profile) return { status: 200, data: profile };

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};

export const onSubscribe = async (razorpayPaymentId: string) => {
  const user = await onCurrentUser();
  if (!user) return { status: 404 }; // User not found

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID ?? "",
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    // Retrieve the payment details using Razorpay's API
    const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);

    if (paymentDetails && paymentDetails.status === "captured") {
      // Update the user's subscription in your database
      const subscribed = await updateSubscription(user.id, {
        customerId: paymentDetails.email || user.emailAddresses[0].emailAddress, // Use Razorpay's email field or your user's email
        plan: "PRO",
      });

      if (subscribed) return { status: 200 }; // Subscription successfully updated
      return { status: 401 }; // Failed to update subscription
    }
    return { status: 404 }; // Payment not found or not captured
  } catch (error) {
    console.error("Error handling subscription:", error);
    return { status: 500 }; // Server error
  }
};
