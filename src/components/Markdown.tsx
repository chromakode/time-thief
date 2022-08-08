import React, { Fragment, ReactNode, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkSmartypants from 'remark-smartypants'

const components = { p: Fragment }
const remarkPlugins = [remarkSmartypants]

export default function Markdown({ children }: { children: ReactNode }) {
  return useMemo(
    () => (
      <>
        {React.Children.map(children, (child) =>
          typeof child === 'string' && !child.match(/^\s+$/) ? (
            <ReactMarkdown
              components={components}
              remarkPlugins={remarkPlugins}
            >
              {child}
            </ReactMarkdown>
          ) : (
            child
          ),
        )}
      </>
    ),
    [children],
  )
}
