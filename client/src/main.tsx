import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app'

const container = document.getElementById('app')
const root = createRoot(container!) // createRoot(container!) if you use TypeScript
root.render(<App />)
