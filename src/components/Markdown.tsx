import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkSmartypants from 'remark-smartypants'

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkSmartypants]}>
      {children}
    </ReactMarkdown>
  )
}
