import { createClient } from '@sanity/client'

const config = {
  projectId: 'ker8zst5',
  dataset: 'production',
  apiVersion: '2023-05-03',
} as const

/** Fresh reads for server components (bypasses Sanity CDN cache). */
export const serverClient = createClient({
  ...config,
  useCdn: false,
})

/** Legacy export — prefer serverClient for page data. */
export const client = serverClient

export type { Track, Project } from './types'
