import type { inferAsyncReturnType } from "@trpc/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "../../env/server.mjs";
import { getRecentTrashTweets } from "../../server/twitter";
import { verifySignature } from "@upstash/qstash/nextjs";

const sendTweetToDiscord = async (
  tweet: NonNullable<
    inferAsyncReturnType<typeof getRecentTrashTweets>["data"]
  >[number]
) => {
  const formattedMessage = `Steal this tweet: https://twitter.com/trashh_dev/status/${tweet.id}`;

  const webhookUrl = env.DISCORD_WEBHOOK_URL;

  return fetch(webhookUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: formattedMessage,
    }),
  });
};

const doTweetProcessing = async (req: NextApiRequest, res: NextApiResponse) => {
  // const tokenFromRequest = req.headers.authorization;

  // if (tokenFromRequest !== env.CRON_TOKEN) {
  //   res.status(401).json({ error: "Unauthorized" });
  //   return;
  // }

  const recentTweets = await getRecentTrashTweets();

  const goodTrashTweets =
    recentTweets?.data?.filter(
      (tweet) =>
        (tweet?.public_metrics?.like_count ?? 0) > 500 &&
        new Date(tweet?.created_at ?? 0) > new Date(Date.now() - 86400000)
    ) ?? [];

  const discordWebhookCalls = goodTrashTweets?.map((tweet) => {
    return sendTweetToDiscord(tweet);
  });

  await Promise.allSettled(discordWebhookCalls);

  return res.status(200).json(goodTrashTweets);
};

export default verifySignature(doTweetProcessing);

export const config = {
  api: {
    bodyParser: false,
  },
};
