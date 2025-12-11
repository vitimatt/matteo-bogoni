'use client'

import {StudioLayout, StudioProvider} from 'sanity'

import config from '@/sanity/config'

export default function StudioPage() {
  return (
    <StudioProvider config={config}>
      <StudioLayout />
    </StudioProvider>
  )
}

