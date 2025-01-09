import {
  createChatHistory,
  getAutomationIDFromPostID,
  getChatHistory,
  getKeywordAutomation,
  getKeywordPost,
  matchKeyword,
  trackResponses,
} from "@/actions/webhooks/queries";
import { sendDM, sendPrivateMessage } from "@/lib/fetch";
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { groqai } from "@/lib/groqai";
import { findAutomation } from "@/actions/automations/queries";

export async function GET(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get("hub.challenge");
  return new NextResponse(hub);
}

export async function POST(req: NextRequest) {
  const webhook_payload = await req.json();
  let matcher;
  try {
    if (webhook_payload.entry[0].messaging) {
      matcher = await matchKeyword(
        webhook_payload.entry[0].messaging[0].message.text
      );
    }

    if (webhook_payload.entry[0].changes) {
      matcher = await matchKeyword(
        webhook_payload.entry[0].changes[0].value.text
      );
      console.log("🔴 matcher ---> ", matcher);
    }

    if (matcher && matcher.automationId) {
      //We have  a keyword matcher
      if (webhook_payload.entry[0].messaging) {
        console.log("🔴 if cond 3-1 ---> ");
        const automation = await getKeywordAutomation(
          matcher.automationId,
          true
        ); // true means we are in a messaging context

        if (automation && automation.trigger) {
          if (
            automation.listener &&
            automation.listener.listener === "MESSAGE"
          ) {
            const direct_message = await sendDM(
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              automation.listener.prompt,
              automation.User?.integrations[0].token!
            ); // Send a direct message to the user
            console.log("🔴 direct_message 1 ---> ", direct_message);

            if (direct_message.status === 200) {
              const tracked = await trackResponses(automation.id, "DM"); //query action
              if (tracked) {
                return NextResponse.json(
                  {
                    message: "Message sent",
                  },
                  { status: 200 }
                ); // Return a 200 status code with a JSON response
              }
            }
          }

          if (
            automation.listener &&
            automation.listener.listener === "SMARTAI" &&
            automation.User?.subscription?.plan === "PRO"
          ) {
            let no_response = "";
            const smart_ai_message = await groqai.chat.completions.create({
              messages: [
                {
                  role: "assistant",
                  content: `${automation.listener.prompt}: Keep responses under 2 sentences`,
                },
              ],
              model: "llama3-8b-8192",
            });

            console.log(
              "🔴 smart_ai_message ---> ",
              smart_ai_message.choices[0].message,
              automation.listener.prompt
            );

            if (!smart_ai_message.choices[0].message.content) {
              no_response = "Sorry, I do not understand, please elaborate!";
            }

            console.log("🔴 no_response ---> ", no_response);
            if (smart_ai_message.choices[0].message.content || no_response) {
              console.log(
                "🔴 smart_ai_message.choices[0].message.content ---> ",
                smart_ai_message.choices[0].message.content
              );
              const reciever = createChatHistory(
                automation.id,
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].messaging[0].sender.id,
                webhook_payload.entry[0].messaging[0].message.text
              );

              const sender = createChatHistory(
                automation.id,
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].messaging[0].sender.id,
                smart_ai_message.choices[0].message.content ?? no_response
              );

              await client.$transaction([reciever, sender]);

              const direct_message = await sendDM(
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].messaging[0].sender.id,
                smart_ai_message.choices[0].message.content ?? no_response,
                automation.User.integrations[0].token
              );
              no_response = "";
              console.log("🔴 direct_message 2 ---> ", direct_message);

              if (direct_message.status === 200) {
                const tracked = await trackResponses(automation.id, "DM");
                if (tracked) {
                  return NextResponse.json(
                    { message: "Message sent" },
                    { status: 200 }
                  );
                }
              }
            }
          }
        }
      }

      if (
        webhook_payload.entry[0].changes &&
        webhook_payload.entry[0].changes[0].field === "comments"
      ) {
        console.log("🔴 if cond 3-2 ---> ");
        const automation = await getKeywordAutomation(
          matcher.automationId,
          false
        );

        const automationID = await getAutomationIDFromPostID(
          webhook_payload.entry[0].changes[0].value.media.id
        );
        console.log("🔴 automationID ---> ", automationID);

        const automations_post = await getKeywordPost(
          webhook_payload.entry[0].changes[0].value.media.id,
          automation?.id!
        );
        console.log(
          "🔴 automation, automations_post ---> ",
          webhook_payload.entry[0].changes[0].value.media.id,
          automation?.id!,
          automations_post
        );
        if (automation && automations_post && automation.trigger) {
          console.log("🔴 if cond 3-2-1 ---> ");
          if (automation.listener) {
            console.log("🔴 if cond 3-2-2 ---> ");
            if (automation.listener.listener === "MESSAGE") {
              console.log("🔴 if cond 3-2-3 ---> ");
              // const direct_message = await sendDM(
              //   webhook_payload.entry[0].id,
              //   webhook_payload.entry[0].changes[0].value.from.id,
              //   automation.listener?.prompt,
              //   automation.User?.integrations[0].token!
              // );
              const direct_message = await sendPrivateMessage(
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].changes[0].value.id,
                automation.listener?.prompt,
                automation.User?.integrations[0].token!
              );
              console.log("🔴 direct_message 3 ---> ", direct_message);
              if (direct_message.status === 200) {
                const tracked = await trackResponses(automation.id, "COMMENT");

                if (tracked) {
                  return NextResponse.json(
                    { message: "Message sent" },
                    { status: 200 }
                  );
                }
              }
            }

            if (
              automation.listener.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO"
            ) {
              const smart_ai_message = await groqai.chat.completions.create({
                model: "llama3-8b-8192",
                messages: [
                  {
                    role: "assistant",
                    content: `${automation.listener.prompt}: Keep responses under 2 sentences`,
                  },
                ],
              });
              if (smart_ai_message.choices[0].message.content) {
                const receiver = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.from.id,
                  webhook_payload.entry[0].changes[0].value.text
                );

                const sender = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.from.id,
                  smart_ai_message.choices[0].message.content
                );

                await client.$transaction([receiver, sender]);

                // const direct_message = await sendDM(
                //   webhook_payload.entry[0].id,
                //   webhook_payload.entry[0].changes[0].value.from.id,
                //   smart_ai_message.choices[0].message.content,
                //   automation.User.integrations[0].token
                // );
                const direct_message = await sendPrivateMessage(
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.id,
                  automation.listener?.prompt,
                  automation.User?.integrations[0].token!
                );
                console.log("🔴 direct_message 4 ---> ", direct_message);

                if (direct_message.status === 200) {
                  const tracked = await trackResponses(
                    automation.id,
                    "COMMENT"
                  );

                  if (tracked) {
                    return NextResponse.json(
                      {
                        message: "Message sent",
                      },
                      { status: 200 }
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    if (!matcher) {
      console.log("🔴 if cond 3-3 ---> ");
      const customer_history = await getChatHistory(
        webhook_payload.entry[0].messaging[0].recipient.id,
        webhook_payload.entry[0].messaging[0].sender.id
      );

      if (customer_history.history.length > 0) {
        const automation = await findAutomation(customer_history.automationId!);

        if (
          automation?.User?.subscription?.plan === "PRO" &&
          automation.listener?.listener === "SMARTAI"
        ) {
          const smart_ai_message = await groqai.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [
              {
                role: "assistant",
                content: `${automation.listener.prompt}: Keep responses under 2 sentences`,
              },
              ...customer_history.history,
              {
                role: "user",
                content: webhook_payload.entry[0].messaging[0].message.text,
              },
            ],
          });

          if (smart_ai_message.choices[0].message.content) {
            const receiver = createChatHistory(
              automation.id,
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              webhook_payload.entry[0].messaging[0].message.text
            );

            const sender = createChatHistory(
              automation.id,
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              smart_ai_message.choices[0].message.content
            );

            await client.$transaction([receiver, sender]);

            const direct_message = await sendDM(
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              smart_ai_message.choices[0].message.content,
              automation.User?.integrations[0].token!
            );

            if (direct_message.status === 200) {
              //if successfully send we return
              return NextResponse.json(
                {
                  message: "Message sent",
                },
                {
                  status: 200,
                }
              );
            }
          }
        }
      }

      return NextResponse.json(
        {
          message: "No automation set",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: "No automation set" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "No automation set",
      },
      { status: 200 }
    );
  }
}
