import { GetServerSideProps } from "next"
import type { ReactElement } from "react"

import { QueryClient } from "@tanstack/react-query"

import { SiteArchives } from "~/components/site/SiteArchives"
import { SiteLayout } from "~/components/site/SiteLayout"
import { getServerSideProps as getLayoutServerSideProps } from "~/components/site/SiteLayout.server"
import { serverSidePropsHandler } from "~/lib/server-side-props"
import { PageVisibilityEnum } from "~/lib/types"
import { useGetPagesBySiteLite } from "~/queries/page"
import { useGetSite } from "~/queries/site"

export const getServerSideProps: GetServerSideProps = serverSidePropsHandler(
  async (ctx) => {
    const queryClient = new QueryClient()
    const domainOrSubdomain = ctx.params!.site as string
    const { props: layoutProps } = await getLayoutServerSideProps(
      ctx,
      queryClient,
      {
        limit: 100,
      },
    )

    return {
      props: {
        ...layoutProps,
        domainOrSubdomain,
      },
    }
  },
)

function SiteArchivesPage({
  domainOrSubdomain,
}: {
  domainOrSubdomain: string
}) {
  const site = useGetSite(domainOrSubdomain)
  const posts = useGetPagesBySiteLite({
    characterId: site.data?.characterId,
    limit: 100,
    type: "post",
    visibility: PageVisibilityEnum.Published,
  })

  return (
    <SiteArchives
      posts={posts.data}
      fetchNextPage={posts.fetchNextPage}
      hasNextPage={posts.hasNextPage}
      isFetchingNextPage={posts.isFetchingNextPage}
      showTags={true}
    />
  )
}

SiteArchivesPage.getLayout = (page: ReactElement) => {
  return (
    <SiteLayout title="Archives" type="archive">
      {page}
    </SiteLayout>
  )
}

export default SiteArchivesPage
