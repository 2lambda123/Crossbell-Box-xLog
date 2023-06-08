"use client"

import { Tooltip } from "~/components/ui/Tooltip"
import { useTranslation } from "~/lib/i18n/client"
import { cn, scrollTo } from "~/lib/utils"
import { useCheckComment, useGetComments } from "~/queries/page"

import { Button } from "../ui/Button"

export const ReactionComment: React.FC<{
  characterId?: number
  noteId?: number
}> = ({ characterId, noteId }) => {
  const { t } = useTranslation("common")

  const comments = useGetComments({
    characterId: characterId,
    noteId: noteId,
  })

  const isCommented = useCheckComment({
    noteCharacterId: characterId,
    noteId: noteId,
  })

  return (
    <>
      <div className={cn("xlog-reactions-comment flex items-center sm:mb-0")}>
        <Button
          variant="comment"
          variantColor="light"
          className={cn(
            "flex items-center",
            {
              active: isCommented.data?.count,
            },
            "!h-auto flex-col",
          )}
          isAutoWidth={true}
          onClick={() => scrollTo("#comments", true)}
        >
          {(() => {
            const inner = (
              <i
                className={cn("icon-[mingcute--comment-fill]", "text-[33px]")}
              />
            )
            return (
              <Tooltip label={t("Comments")} placement="right">
                {inner}
              </Tooltip>
            )
          })()}
          <span className={cn("leading-snug")}>
            {!comments.isLoading ? comments.data?.pages?.[0]?.count : "-"}
          </span>
        </Button>
      </div>
    </>
  )
}
