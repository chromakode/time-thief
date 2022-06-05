import React from 'react'
import { createRoot } from 'react-dom/client'
import PouchDB from 'pouchdb'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { Provider as PouchProvider } from 'use-pouchdb'
import theme from './theme'
import { ChakraProvider } from '@chakra-ui/react'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'

import './utils/devUtils'

export const _db = new PouchDB('entities')

const syncEndpoint = localStorage['syncEndpoint']
if (syncEndpoint) {
  PouchDB.sync(_db, syncEndpoint, { live: true, retry: true })
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <PouchProvider pouchdb={_db}>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </PouchProvider>
  </React.StrictMode>,
)

serviceWorkerRegistration.register()

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
