import { cn } from "~/lib/utils"
import { useCodeCopy } from "~/hooks/useCodeCopy"
import { renderPageContent } from "~/markdown"
import { PostToc } from "~/components/site/PostToc"
import { MutableRefObject, useEffect, useMemo } from "react"
import { scroller } from "react-scroll"

export const PageContent: React.FC<{
  content?: string
  className?: string
  toc?: boolean
  inputRef?: MutableRefObject<HTMLDivElement | null>
  onScroll?: (scrollTop: number) => void
  onMouseEnter?: () => void
  parsedContent?: ReturnType<typeof renderPageContent>
}> = ({
  className,
  content,
  toc,
  inputRef,
  onScroll,
  onMouseEnter,
  parsedContent,
}) => {
  useCodeCopy()

  const inParsedContent = useMemo(() => {
    if (parsedContent) {
      return parsedContent
    } else if (content) {
      const result = renderPageContent(content)
      return result
    } else {
      return null
    }
  }, [content, parsedContent])

  useEffect(() => {
    const hashChangeHandler = () => {
      const hash = decodeURIComponent(location.hash.slice(1))
      if (hash) {
        scroller.scrollTo(`user-content-${decodeURIComponent(hash)}`, {
          smooth: true,
          offset: -20,
          duration: 500,
        })
      }
    }

    window.addEventListener("hashchange", hashChangeHandler)
    return () => {
      window.removeEventListener("hashchange", hashChangeHandler)
    }
  }, [])

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={onMouseEnter}
      onScroll={(e) => onScroll?.((e.target as any)?.scrollTop)}
    >
      <div className="xlog-post-content prose" ref={inputRef}>
        {inParsedContent?.element}
      </div>
      {toc && inParsedContent?.toc && <PostToc data={inParsedContent?.toc} />}
    </div>
  )
}
