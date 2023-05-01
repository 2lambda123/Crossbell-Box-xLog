import { useTranslation } from "next-i18next"
import { useMemo, useRef, useState } from "react"

import { useAccountState } from "@crossbell/connect-kit"

import { PatronModal } from "~/components/common/PatronModal"
import { Tooltip } from "~/components/ui/Tooltip"
import { noopArr } from "~/lib/noop"
import { ExpandedCharacter, ExpandedNote } from "~/lib/types"
import { useGetTips } from "~/queries/site"

import { AvatarStack } from "../ui/AvatarStack"
import { Button } from "../ui/Button"

export const ReactionTip: React.FC<{
  characterId?: number
  noteId?: number
  site?: ExpandedCharacter
  page?: ExpandedNote
}> = ({ characterId, noteId, site, page }) => {
  const { t } = useTranslation("common")

  const account = useAccountState((s) => s.computed.account)

  const [isTipOpen, setIsTipOpen] = useState(false)
  const tipRef = useRef<HTMLButtonElement>(null)

  const tips = useGetTips({
    toCharacterId: characterId,
    toNoteId: noteId,
  })
  const isTip = useGetTips({
    toCharacterId: characterId,
    toNoteId: noteId,
    characterId: account?.characterId || "0",
  })

  const tip = () => {
    if (characterId && noteId) {
      setIsTipOpen(true)
    }
  }

  const avatars = useMemo(
    () =>
      tips.data?.pages?.[0]?.list
        ?.sort((a, b) =>
          b.character?.metadata?.content?.avatars?.[0] ? 1 : -1,
        )
        .slice(0, 3)
        .map((mint) => ({
          images: mint.character?.metadata?.content?.avatars,
          name: mint.character?.metadata?.content?.name,
        })) || noopArr,
    [tips.data?.pages],
  )

  return (
    <>
      <div className="xlog-reactions-tip flex items-center">
        <Button
          variant="tip"
          className={`flex items-center mr-2 ${
            isTip.isSuccess && isTip.data.pages?.[0].count && "active"
          }`}
          isAutoWidth={true}
          onClick={tip}
          ref={tipRef}
        >
          {(() => {
            const inner = (
              <i className="icon-[mingcute--heart-fill] text-[40px]" />
            )
            return (
              <Tooltip label={t("Tip")} placement="top">
                {inner}
              </Tooltip>
            )
          })()}
          <span className="ml-2">{tips.data?.pages?.[0]?.count || 0}</span>
        </Button>

        <AvatarStack
          avatars={avatars}
          count={tips.data?.pages?.[0]?.count || 0}
          onClick={tip}
        />
      </div>
      <PatronModal
        site={site}
        open={isTipOpen}
        setOpen={setIsTipOpen}
        page={page}
      />
    </>
  )
}
