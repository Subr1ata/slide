import { client } from "@/lib/prisma";

export const matchKeyword = async (keyword: string) => {
  return await client.keyword.findFirst({
    where: {
      word: {
        equals: keyword,
        mode: "insensitive",
      },
    },
  });
};

export const getKeywordAutomation = async (
  automationId: string,
  dm: boolean
) => {
  return await client.automation.findUnique({
    where: {
      id: automationId,
    },

    //Include some data in response
    include: {
      dms: dm, //Include dms if true
      trigger: {
        where: {
          type: dm ? "DM" : "COMMENT", //Include trigger if true
        },
      },
      listener: true, //Include listener
      User: {
        select: {
          subscription: {
            select: {
              plan: true, //Include plan
            },
          },
          integrations: {
            select: {
              token: true, //Include token
            },
          },
        },
      },
    },
  });
};

export const trackResponses = async (
  automationId: string,
  type: "COMMENT" | "DM"
) => {
  if (type === "COMMENT") {
    return await client.listener.update({
      where: {
        automationId,
      },
      data: {
        commentCount: {
          increment: 1, //Increment comment count
        },
      },
    });
  }

  if (type === "DM") {
    return await client.listener.update({
      where: { automationId },
      data: { dmCount: { increment: 1 } },
    });
  }
};

export const createChatHistory = (
  automationId: string,
  sender: string,
  receiver: string,
  message: string
) => {
  return client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      dms: {
        create: {
          receiver,
          senderId: sender,
          message,
        },
      },
    },
  });
};

export const getKeywordPost = async (postId: string, automationId: string) => {
  return await client.post.findFirst({
    where: {
      AND: [{ postid: postId }, { automationId }],
    },
    select: { automationId: true }, //Select only the automationId
  });
};

export const getChatHistory = async (sender: string, receiver: string) => {
  const history = await client.dms.findMany({
    where: {
      AND: [{ senderId: sender }, { receiver }],
    },
    orderBy: { createdAt: "asc" },
  });
  const chatSession: {
    role: "assistant" | "user";
    content: string;
  }[] = history.map((chat) => {
    return {
      role: chat.receiver ? "assistant" : "user",
      content: chat.message!,
    };
  });

  return {
    history: chatSession,
    automationId: history[history.length - 1].automationId,
  };
};
