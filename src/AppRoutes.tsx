import { ChakraProvider } from '@chakra-ui/react'
import { Routes, Route } from 'react-router-dom'
import App from './App'
import LandingPage from './LandingPage'
import { baseTheme } from './theme'

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        index
        element={
          <ChakraProvider theme={baseTheme}>
            <LandingPage />
          </ChakraProvider>
        }
      />
      <Route path="app">
        <Route index element={<App />} />
        <Route path="log" element={<App isShowingLog />} />
        <Route
          path="settings"
          element={<App isShowingLog isShowingSettings />}
        />
      </Route>
    </Routes>
  )
}
