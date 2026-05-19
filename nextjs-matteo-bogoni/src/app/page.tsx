import { serverClient } from '@/sanity/client'
import type { Project, Track } from '@/sanity/types'
import AudioReactive from '@/components/AudioReactive'

// Always fetch latest CMS content (no static cache from build time)
export const dynamic = 'force-dynamic'

const fetchOptions = { cache: 'no-store' as const }

async function getTracks(): Promise<Track[]> {
  const query = `*[_type == "track" && !(_id in path("drafts.**"))] | order(_createdAt desc) {
    _id,
    title,
    description,
    "audioUrl": audioFile.asset->url
  }`

  return serverClient.fetch(query, {}, fetchOptions)
}

async function getProjects(): Promise<Project[]> {
  const query = `*[_type == "project" && !(_id in path("drafts.**"))] | order(_createdAt desc) {
    _id,
    title,
    "mediaType": media.mediaType,
    "mediaUrl": select(
      media.mediaType == "image" => media.image.asset->url,
      media.mediaType == "video" => media.video.asset->url
    )
  }`

  return serverClient.fetch(query, {}, fetchOptions)
}

export default async function Home() {
  const [tracks, projects] = await Promise.all([getTracks(), getProjects()])

  return (
    <main
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      <AudioReactive tracks={tracks} projects={projects} />
    </main>
  )
}
