import { serverSideTranslations } from "next-i18next/serverSideTranslations"

import { QueryClient, dehydrate } from "@tanstack/react-query"

import { languageDetector } from "~/lib/language-detector"
import { notFound } from "~/lib/server-side-props"
import { PageVisibilityEnum } from "~/lib/types"
import { fetchGetPage, prefetchGetPagesBySite } from "~/queries/page.server"
import {
  fetchGetSite,
  prefetchGetSiteSubscriptions,
  prefetchGetSiteToSubscriptions,
} from "~/queries/site.server"

export const getServerSideProps = async (
  ctx: any,
  queryClient: QueryClient,
  options?: {
    limit?: number
    useStat?: boolean
    skipPages?: boolean
    preview?: boolean
  },
) => {
  const domainOrSubdomain = ctx.params!.site as string
  const pageSlug = ctx.params!.page as string
  const tag = ctx.params!.tag as string
  const site = await fetchGetSite(domainOrSubdomain, queryClient)

  if (site?.characterId) {
    await Promise.all([
      prefetchGetSiteSubscriptions(
        {
          characterId: site.characterId,
        },
        queryClient,
      ),
      prefetchGetSiteToSubscriptions(
        {
          characterId: site.characterId,
        },
        queryClient,
      ),
      new Promise(async (resolve, reject) => {
        if (options?.preview) {
          // do nothing
        } else if (pageSlug) {
          try {
            const page = await fetchGetPage(
              {
                characterId: site.characterId,
                slug: pageSlug,
                ...(options?.useStat && {
                  useStat: true,
                }),
              },
              queryClient,
            )

            if (
              !page ||
              new Date(page!.metadata?.content?.date_published || "") >
                new Date()
            ) {
              reject(notFound())
            }
          } catch (error) {
            reject(error)
          }
        } else {
          if (!options?.skipPages) {
            await prefetchGetPagesBySite(
              {
                characterId: site.characterId,
                ...(options?.limit && { limit: options.limit }),
                type: "post",
                visibility: PageVisibilityEnum.Published,
                ...(tag && { tags: [tag] }),
                ...(options?.useStat && {
                  useStat: true,
                }),
              },
              queryClient,
            )
          }
        }
        resolve(null)
      }),
    ])
  }

  return {
    props: {
      ...(await serverSideTranslations(languageDetector(ctx), [
        "common",
        "site",
      ])),
      dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
    },
  }
}
