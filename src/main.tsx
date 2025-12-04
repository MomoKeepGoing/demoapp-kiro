import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import './styles/buttons.css'
import App from './App.tsx'
import outputs from '../amplify_outputs.json'

// Configure Amplify with backend outputs
Amplify.configure(outputs)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
