import {createRoot} from 'react'
import {Studio} from 'sanity'
import config from '../sanity.config.js'

const root = createRoot(document.getElementById('sanity'))
root.render(<Studio config={config} />)
