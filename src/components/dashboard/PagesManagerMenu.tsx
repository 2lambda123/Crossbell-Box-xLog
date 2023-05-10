import { useParams, useRouter } from "next/navigation"
import { FC, useEffect, useState } from "react"
import toast from "react-hot-toast"

import { Menu } from "@headlessui/react"
import { useQueryClient } from "@tanstack/react-query"

import { useGetState } from "~/hooks/useGetState"
import { APP_NAME } from "~/lib/env"
import { getNoteSlugFromNote, getTwitterShareUrl } from "~/lib/helpers"
import { useTranslation } from "~/lib/i18n/client"
import { delStorage, getStorage, setStorage } from "~/lib/storage"
import { ExpandedNote } from "~/lib/types"
import { useCreateOrUpdatePage, useDeletePage } from "~/queries/page"
import { useGetSite } from "~/queries/site"

import { DeleteConfirmationModal } from "./DeleteConfirmationModal"

const usePageEditLink = (page: ExpandedNote, isPost: boolean) => {
  const params = useParams()
  const subdomain = params?.subdomain as string

  return `/dashboard/${subdomain}/editor?id=${page.noteId}&type=${
    isPost ? "post" : "page"
  }`
}

interface Item {
  text: string
  icon: JSX.Element
  onClick: () => void
}
export const PagesManagerMenu: FC<{
  isPost: boolean
  page: ExpandedNote
  onClick: () => void
}> = ({ isPost, page, onClick: onClose }) => {
  const { t } = useTranslation("dashboard")

  const isCrossbell = !page.metadata?.content?.sources?.includes("xlog")
  const router = useRouter()
  const params = useParams()
  const subdomain = params?.subdomain as string
  const createOrUpdatePage = useCreateOrUpdatePage()

  const editLink = usePageEditLink(page, isPost)
  const queryClient = useQueryClient()
  const deletePage = useDeletePage()

  const [convertToastId, setConvertToastId] = useState("")
  const [deleteToastId, setDeleteToastId] = useState("")

  const getDeleteToastId = useGetState(deleteToastId)
  const getCurrentToastId = useGetState(convertToastId)

  useEffect(() => {
    if (deletePage.isSuccess) {
      toast.success(t("Deleted!"), {
        id: getDeleteToastId(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletePage.isSuccess])

  useEffect(() => {
    if (deletePage.isError) {
      toast.error(t("Fail to Deleted."), {
        id: getDeleteToastId(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletePage.isError])

  useEffect(() => {
    if (createOrUpdatePage.isSuccess) {
      toast.success(t("Converted!"), {
        id: getCurrentToastId(),
      })
    } else if (createOrUpdatePage.isError) {
      toast.error(t("Failed to convert."), {
        id: getCurrentToastId(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOrUpdatePage.isSuccess, createOrUpdatePage.isError])

  const site = useGetSite(subdomain)

  const items: Item[] = [
    {
      text: "Edit",
      icon: <span className="icon-[mingcute--edit-line] inline-block"></span>,
      onClick() {
        router.push(editLink)
      },
    },
    {
      text:
        "Convert to " +
        (isCrossbell
          ? `${APP_NAME} ${isPost ? "Post" : "Page"}`
          : isPost
          ? "Page"
          : "Post"),
      icon: (
        <span className="icon-[mingcute--transfer-3-line] inline-block"></span>
      ),
      onClick() {
        const toastId = toast.loading("Converting...")
        if (isCrossbell) {
          setConvertToastId(toastId)
          createOrUpdatePage.mutate({
            published: true,
            pageId: `${page.characterId}-${page.noteId}`,
            siteId: subdomain,
            tags: page.metadata?.content?.tags
              ?.filter((tag) => tag !== "post" && tag !== "page")
              ?.join(", "),
            isPost: isPost,
            applications: page.metadata?.content?.sources,
            characterId: page.characterId,
          })
        } else {
          if (!page.noteId) {
            const data = getStorage(
              `draft-${site.data?.characterId}-${page.draftKey}`,
            )
            data.isPost = !isPost
            setStorage(`draft-${site.data?.characterId}-${page.draftKey}`, data)
            queryClient.invalidateQueries([
              "getPagesBySite",
              site.data?.characterId,
            ])
            queryClient.invalidateQueries(["getPage", page.characterId])
            toast.success("Converted!", {
              id: toastId,
            })
          } else {
            setConvertToastId(toastId)
            createOrUpdatePage.mutate({
              published: true,
              pageId: `${page.characterId}-${page.noteId}`,
              siteId: subdomain,
              tags: page.metadata?.content?.tags
                ?.filter((tag) => tag !== "post" && tag !== "page")
                ?.join(", "),
              isPost: !isPost,
              applications: page.metadata?.content?.sources,
              characterId: page.characterId,
            })
          }
        }
      },
    },
    {
      text: "Preview",
      icon: <span className="icon-[mingcute--eye-line] inline-block"></span>,
      onClick() {
        const slug = getNoteSlugFromNote(page)
        if (!slug) return
        window.open(`/site/${subdomain}/${slug}`)
      },
    },
    {
      text: "Share to Twitter",
      icon: (
        <span className="icon-[mingcute--twitter-line] inline-block"></span>
      ),
      onClick() {
        if (site.data) {
          const twitterShareUrl = getTwitterShareUrl({
            page,
            site: site.data,
            t,
          })
          window.open(twitterShareUrl)
        }
      },
    },
    {
      text: "Delete",
      icon: (
        <span className="icon-[mingcute--delete-2-line] inline-block"></span>
      ),
      onClick() {
        setDeleteConfirmModalOpen(true)
      },
    },
  ]

  useEffect(() => {
    return () => {
      if (getDeleteToastId()) {
        toast.success(t("Deleted!"), {
          id: getDeleteToastId(),
        })
      }
    }
  }, [])

  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] =
    useState<boolean>(false)
  const onDelete = () => {
    if (!page.noteId) {
      const toastId = toast.loading("Deleting...")
      delStorage(`draft-${site.data?.characterId}-${page.draftKey}`)
      Promise.all([
        queryClient.refetchQueries(["getPagesBySite", site.data?.characterId]),
        queryClient.refetchQueries(["getPage", page.characterId]),
      ]).then(() => {
        toast.success("Deleted!", {
          id: toastId,
        })
      })
    } else {
      setDeleteToastId(toast.loading("Deleting..."))
      deletePage.mutate({
        site: subdomain,
        id: `${page.characterId}-${page.noteId}`,
        characterId: page.characterId,
      })
    }
  }

  return (
    <>
      <Menu.Items className="text-sm absolute z-20 right-0 bg-white shadow-modal rounded-lg overflow-hidden py-2 w-64 ring-1 ring-border">
        {items.map((item) => {
          return (
            <Menu.Item key={item.text}>
              <button
                type="button"
                className="h-10 flex w-full space-x-2 items-center px-3 hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault()
                  item.onClick()
                  onClose()
                }}
              >
                <span className="inline-flex">{item.icon}</span>
                <span>{t(item.text)}</span>
              </button>
            </Menu.Item>
          )
        })}
      </Menu.Items>
      <DeleteConfirmationModal
        open={deleteConfirmModalOpen}
        setOpen={setDeleteConfirmModalOpen}
        onConfirm={onDelete}
        isPost={isPost}
      />
    </>
  )
}
