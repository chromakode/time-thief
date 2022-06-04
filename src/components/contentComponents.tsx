import '@fontsource/roboto-flex/variable-full.css'
import React from 'react'
import MultilineInput from './content/MultilineInput'
import PhotoInput from './content/PhotoInput'
import ContentTitle from './content/Title'

// TODO: per component type typescc

export interface ContentComponentProps {
  db: PouchDB.Database
  entityDoc: {
    _id: string
    [key: string]: any
  }
  save: (updates: { [key: string]: any }) => void
  saveAttachment: (id: string, attachment: Blob) => void
  [key: string]: any
}

const contentComponents: Map<string, React.FunctionComponent<any>> = new Map()

contentComponents.set('title', ContentTitle)

contentComponents.set('input/multi-line', MultilineInput)

contentComponents.set('input/photo', PhotoInput)

export default contentComponents
