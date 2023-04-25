import { toHtml } from "hast-util-to-html"
import DOMPurify from "isomorphic-dompurify"
import katex from "katex"
import { toHast } from "mdast-util-to-hast"
import type { Result as TocResult } from "mdast-util-toc"
import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-scroll"

const inlineElements = ["delete", "strong", "emphasis", "inlineCode"]

function getIds(items: TocResult["map"]) {
  return (
    items?.children?.reduce((acc: string[], item) => {
      item.children.forEach((child) => {
        if (child.type === "paragraph" && (child.children[0] as any).url) {
          acc.push((child.children[0] as any).url.slice(1))
        } else if (child.type === "list") {
          acc.push(...getIds(child))
        }
      })
      return acc
    }, []) || []
  )
}

function getElement(id: string) {
  return document.querySelector(`a[href="#${id}"]`)
}

function useActiveId(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>()
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.getAttribute("href"))
          }
        })
      },
      { rootMargin: `0% 0% -80% 0%` },
    )
    itemIds.forEach((id) => {
      const element = getElement(id)
      if (element) {
        observer.observe(element)
      }
    })
    return () => {
      itemIds.forEach((id) => {
        const element = getElement(id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [itemIds])
  return activeId
}

function renderItems(
  items: TocResult["map"],
  activeId?: string | null,
  prefix = "",
) {
  return (
    <ol className={prefix ? "pl-5" : ""}>
      {items?.children?.map((item, index) => (
        <li key={index}>
          {item.children.map((child: any, i) => {
            const children =
              child.children[0].children?.[0]?.children ||
              child.children[0].children
            let content = "",
              isInlineMath = false,
              isInlineElement = false
            children.map((child: any) => {
              if (child.type === "inlineMath") {
                isInlineMath = true
              } else if (inlineElements.includes(child.type)) {
                isInlineElement = true
                content += toHtml(toHast(child) || [])
              } else {
                content += child.value
              }
            })
            return (
              <span key={index + "-" + i}>
                {child.type === "paragraph" && child.children?.[0]?.url && (
                  <Link
                    to={`user-content-${decodeURIComponent(
                      child.children[0].url.slice(1),
                    )}`}
                    spy={true}
                    smooth={true}
                    duration={500}
                    offset={-20}
                    href={child.children[0].url}
                    title={content}
                    className={
                      (activeId === child.children[0].url
                        ? "text-accent"
                        : "text-zinc-700") +
                      " truncate inline-block max-w-full align-bottom hover:text-accent"
                    }
                  >
                    {isInlineMath || isInlineElement ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            isInlineMath
                              ? katex.renderToString(
                                  `${prefix}${index + 1}. ${content}`,
                                  {
                                    output: "html",
                                  },
                                )
                              : `${prefix}${index + 1}. ${content}`,
                          ),
                        }}
                      />
                    ) : (
                      `${prefix}${index + 1}. ${content}`
                    )}
                  </Link>
                )}
                {child.type === "list" &&
                  renderItems(child, activeId, `${index + 1}.`)}
              </span>
            )
          })}
        </li>
      ))}
    </ol>
  )
}

export const PostToc: React.FC<{
  data: TocResult
}> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [maxWidth, setMaxWidth] = useState(0)
  useEffect(() => {
    if (containerRef?.current) {
      setMaxWidth(
        (window.innerWidth -
          (containerRef.current?.parentElement?.clientWidth || 0)) /
          2 -
          40,
      )
    }
  }, [containerRef])

  const idList = getIds(data?.map)
  const activeId = useActiveId(idList)

  return (
    <div
      className="xlog-post-toc absolute left-full pl-10 h-full top-0"
      style={{
        maxWidth: maxWidth > 40 ? maxWidth : 0,
        display: maxWidth > 40 ? "block" : "none",
      }}
      ref={containerRef}
    >
      <div
        className="sticky top-14 text-sm leading-loose whitespace-nowrap text-ellipsis max-h-[calc(100vh-theme('spacing.28'))] truncate"
        style={{
          overflowY: "auto",
        }}
      >
        {renderItems(data?.map, activeId)}
      </div>
    </div>
  )
}
