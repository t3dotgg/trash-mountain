import { Client } from "twitter-api-sdk";
import { env } from "../env/server.mjs";

export async function getRecentTrashTweets() {
  const client = new Client(env.TWITTER_API_BEARER_TOKEN);

  const response = await client.tweets.tweetsRecentSearch({
    query: "from:trashh_dev has:images -is:reply -is:retweet",
    "tweet.fields": ["public_metrics", "created_at"],
  });

  return response;
}
