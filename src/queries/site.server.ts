import chroma from "chroma-js"

import { QueryClient } from "@tanstack/react-query"

import { getAverageColor } from "~/lib/fast-average-color-node"
import { toGateway } from "~/lib/ipfs-parser"
import { cacheGet } from "~/lib/redis.server"
import { ExpandedCharacter } from "~/lib/types"
import * as siteModel from "~/models/site.model"

import { NFTSCAN_API_KEY } from "../lib/env.server"

export const prefetchGetSite = async (
  input: string,
  queryClient: QueryClient,
) => {
  const key = ["getSite", input]
  await queryClient.prefetchQuery(key, async () => {
    return cacheGet({
      key,
      getValueFun: () => siteModel.getSite(input),
    })
  })
}

export const fetchGetSite = async (
  input: string,
  queryClient: QueryClient,
): Promise<ReturnType<typeof siteModel.getSite>> => {
  const key = ["getSite", input]

  // https://github.com/vercel/next.js/blob/8d228780e72706ef4bd5b6327ede2c0340181353/packages/next/src/lib/metadata/resolvers/resolve-opengraph.ts#L49-L51
  // Next.js will mutate objects in place. The fetch result will be cached by Next.js as well.
  // Consequently, when we pass site into `generateMetadata`, `site.metadata.content.avatars` will be replaced with `URL` by Next.js.
  // To resolve this issue, we return a new object every time `fetchGetSite` is used.
  // Remove this temporary solution once https://github.com/vercel/next.js/issues/49501 has been resolved.
  return JSON.parse(
    JSON.stringify(
      await queryClient.fetchQuery(key, async () => {
        return cacheGet({
          key,
          getValueFun: () => siteModel.getSite(input),
        })
      }),
    ),
  )
}

export const prefetchGetSiteSubscriptions = async (
  input: Parameters<typeof siteModel.getSiteSubscriptions>[0],
  queryClient: QueryClient,
) => {
  const key = ["getSiteSubscriptions", input]
  await queryClient.prefetchInfiniteQuery({
    queryKey: key,
    queryFn: async ({ pageParam }) => {
      return cacheGet({
        key,
        getValueFun: () => {
          return siteModel.getSiteSubscriptions({
            characterId: input.characterId,
            cursor: pageParam,
          })
        },
      })
    },
    getNextPageParam: (lastPage) => lastPage?.cursor || undefined,
  })
}

export const prefetchGetSiteToSubscriptions = async (
  input: Parameters<typeof siteModel.getSiteToSubscriptions>[0],
  queryClient: QueryClient,
) => {
  const key = ["getSiteToSubscriptions", input]
  await queryClient.prefetchInfiniteQuery({
    queryKey: key,
    queryFn: async ({ pageParam }) => {
      return cacheGet({
        key,
        getValueFun: () => {
          return siteModel.getSiteToSubscriptions({
            ...input,
            cursor: pageParam,
          })
        },
      })
    },
    getNextPageParam: (lastPage) => lastPage?.cursor || undefined,
  })
}

export const fetchGetComments = async (
  data: Parameters<typeof siteModel.getCommentsBySite>[0],
  queryClient: QueryClient,
) => {
  const key = ["getComments", data]
  if (!data.characterId) {
    return null
  }
  return await queryClient.fetchQuery(key, async () => {
    return cacheGet({
      key,
      getValueFun: () =>
        siteModel.getCommentsBySite({
          characterId: data.characterId,
        }),
    }) as Promise<ReturnType<typeof siteModel.getCommentsBySite>>
  })
}

export const getNFTs = async (address?: string) => {
  if (!NFTSCAN_API_KEY || !address) {
    return null
  }

  return cacheGet({
    key: `nfts/${address}`,
    noUpdate: true,
    expireTime: 60 * 60 * 24,
    getValueFun: async () => {
      const result = await (
        await fetch(
          `https://restapi.nftscan.com/api/v2/assets/chain/${address}?erc_type=&chain=eth;bnb;polygon;arbitrum;optimism;avax;cronos;platon;moonbeam;fantom;gnosis`,
          {
            headers: {
              "X-API-KEY": NFTSCAN_API_KEY,
            },
          },
        )
      ).json()
      return result.data
    },
  })
}

export const getCharacterColors = async (character?: ExpandedCharacter) => {
  const key = ["getThemeColors", character?.handle]
  if (!character) {
    return null
  }
  return cacheGet({
    key,
    getValueFun: async () => {
      let colors = {}

      try {
        if (
          character.metadata?.content?.banners?.[0]?.mime_type?.split(
            "/",
          )[0] === "image"
        ) {
          const color = await getAverageColor(
            toGateway(
              character.metadata.content.banners[0].address,
              "https://cloudflare-ipfs.com/ipfs/",
            ),
          )
          colors = {
            dark: {
              averageColor: chroma(color.hex).luminance(0.007).hex(),
              autoHoverColor: chroma(color.hex).luminance(0.02).hex(),
              autoThemeColor: chroma(color.hex)
                .saturate(3)
                .luminance(0.3)
                .hex(),
            },
            light: {
              averageColor: chroma(color.hex).hex(),
              autoHoverColor: chroma(color.hex).luminance(0.8).hex(),
              autoThemeColor: chroma(color.hex)
                .saturate(3)
                .luminance(0.3)
                .hex(),
            },
          }
        } else if (character.metadata?.content?.avatars?.[0]) {
          const color = await getAverageColor(
            toGateway(
              character.metadata.content.avatars[0],
              "https://cloudflare-ipfs.com/ipfs/",
            ),
          )
          colors = {
            dark: {
              averageColor: chroma(color.hex).luminance(0.007).hex(),
              autoHoverColor: chroma(color.hex).luminance(0.02).hex(),
              autoThemeColor: chroma(color.hex)
                .saturate(3)
                .luminance(0.3)
                .hex(),
            },
            light: {
              averageColor: chroma(color.hex).luminance(0.95).hex(),
              autoHoverColor: chroma(color.hex).luminance(0.8).hex(),
              autoThemeColor: chroma(color.hex)
                .saturate(3)
                .luminance(0.3)
                .hex(),
            },
          }
        }
      } catch (error) {}

      return colors
    },
  }) as Promise<{
    dark?: {
      averageColor?: string
      autoHoverColor?: string
      autoThemeColor?: string
    }
    light?: {
      averageColor?: string
      autoHoverColor?: string
      autoThemeColor?: string
    }
  }>
}
