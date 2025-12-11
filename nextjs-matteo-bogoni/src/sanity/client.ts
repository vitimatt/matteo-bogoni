import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: 'ker8zst5',
  dataset: 'production',
  useCdn: true,
  token: 'sknib1jrHteF0Ii0nCXUIEJMXOZnaKo369HDrn8lqQIkDscc8OZE3GuNg8h2JOcklJtiBus5w2mU52NQyixg8PUAcE4ZfJeubK4HfduSMpYdmE9jhoSaPPk8zrbjpOV1zGj19FuAXigQmf5KLDguxYCO4iYu8MZSfJufMj5Xn8QBu5JV9IOD',
  apiVersion: '2023-05-03',
})

export interface Track {
  _id: string
  title: string
  description?: string
  audioUrl?: string
}
