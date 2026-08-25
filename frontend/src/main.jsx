import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css'
import '@mantine/carousel/styles.css'
import './index.css'
import App from './App.jsx'
import { MantineProvider, createTheme } from '@mantine/core'

const theme = createTheme({
  colors: {
    teal: ['#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#266F71', '#174849', '#134e4a'],
  },
  primaryColor: 'teal',
  primaryShade: 7,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </StrictMode>,
)
