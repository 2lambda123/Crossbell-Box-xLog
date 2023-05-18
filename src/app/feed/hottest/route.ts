import { SITE_URL } from "~/lib/env"
import { parsePost } from "~/lib/json-feed"
import { NextServerResponse } from "~/lib/server-helper"
import { ExpandedNote } from "~/lib/types"
import { getFeed } from "~/models/home.model"

export async function GET(request: Request) {
  const searchParams = new URLSearchParams(request.url.split("?")[1])

  const feed = await getFeed({
    type: "hot",
    daysInterval: parseInt(searchParams.get("interval") || "0"),
    useHTML: true,
    limit: 10,
  })

  const data = {
    version: "https://jsonfeed.org/version/1",
    title: "xLog Latest",
    icon: "https://ipfs.4everland.xyz/ipfs/bafkreigxdnr5lvtjxqin5upquomrti2s77hlgtjy5zaeu43uhpny75rbga",
    home_page_url: `${SITE_URL}/activities`,
    feed_url: `${SITE_URL}/feed/latest`,
    items: feed?.list?.map((post: ExpandedNote) => parsePost(post)),
  }

  const format = searchParams.get("format") === "xml" ? "xml" : "json"

  const res = new NextServerResponse()
  return res.status(200).rss(data, format)
}
