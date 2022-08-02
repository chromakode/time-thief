import React, { Fragment, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkSmartypants from 'remark-smartypants'

export default function Markdown({ children }: { children: ReactNode }) {
  return (
    <>
      {React.Children.map(children, (child) =>
        typeof child === 'string' && !child.match(/^\s+$/) ? (
          <ReactMarkdown
            components={{ p: Fragment }}
            remarkPlugins={[remarkSmartypants]}
          >
            {child}
          </ReactMarkdown>
        ) : (
          child
        ),
      )}
    </>
  )
}
