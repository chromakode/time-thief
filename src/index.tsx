import { ChakraProvider } from '@chakra-ui/react'
import dayjs from 'dayjs'
import calendar from 'dayjs/plugin/calendar'
import relativeTime from 'dayjs/plugin/relativeTime'
import PouchDB from 'pouchdb'
import PouchFind from 'pouchdb-find'
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import reportWebVitals from './reportWebVitals'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import theme from './theme'
import './utils/devUtils'
import 'image-capture'
import AppRoutes from './AppRoutes'
import { BrowserRouter } from 'react-router-dom'

PouchDB.plugin(PouchFind)
dayjs.extend(calendar)
dayjs.extend(relativeTime)

export const _db = new PouchDB('entities')

const syncEndpoint = localStorage['syncEndpoint']
if (syncEndpoint) {
  PouchDB.sync(_db, syncEndpoint, { live: true, retry: true })
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
)

serviceWorkerRegistration.register()

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
