import '@fontsource/roboto-flex/variable-full.css'
import React, { forwardRef } from 'react'
import Branch from './content/Branch'
import EntityLookup from './content/EntityLookup'
import MultilineInput from './content/MultilineInput'
import PhotoInput from './content/PhotoInput'
import PhotoPortraitGuides from './content/PhotoPortraitGuides'
import SelectOption from './content/SelectOption'
import Steps from './content/Steps'
import ContentTitle from './content/Title'

// TODO: per component type typescc

export interface ContentComponentProps {
  db: PouchDB.Database
  spec: any
  context: any
  entityDoc: {
    _id: string
    [key: string]: any
  }
  set: (updates: { [key: string]: any }, options?: { dirty?: boolean }) => void
  setContext: (updates: { [key: string]: any }) => void
  saveAttachment: (id: string, attachment: Blob) => Promise<void>
  [key: string]: any
}

export interface ContentComponentRef {
  finalize: () => void
}

const contentComponents: Map<string, React.FunctionComponent<any>> = new Map()

// todo: forwardRef used to allow components to specify a finalize method on their ref.
// replacing this with a useFinalize() hook might be more elegant
contentComponents.set('title', forwardRef(ContentTitle))
contentComponents.set('input/multi-line', forwardRef(MultilineInput))
contentComponents.set('input/photo', forwardRef(PhotoInput))
contentComponents.set(
  'input/photo/portrait-with-guides',
  forwardRef(PhotoPortraitGuides),
)
contentComponents.set('input/entity-lookup', forwardRef(EntityLookup))
contentComponents.set('input/select-option', forwardRef(SelectOption))
contentComponents.set('steps', forwardRef(Steps))
contentComponents.set('branch', forwardRef(Branch))

export default contentComponents
