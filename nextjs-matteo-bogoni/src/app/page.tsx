import { client, Track } from '@/sanity/client'
import AudioReactive from '@/components/AudioReactive'

async function getTracks(): Promise<Track[]> {
  const query = `*[_type == "track"] | order(_createdAt desc) {
    _id,
    title,
    description,
    "audioUrl": audioFile.asset->url
  }`
  
  return await client.fetch(query)
}

export default async function Home() {
  const tracks = await getTracks()
  
  // Debug: Log tracks data
  console.log('=== SANITY DATA DEBUG ===')
  console.log('Number of tracks:', tracks.length)
  tracks.forEach((track, index) => {
    console.log(`Track ${index}:`, {
      title: track.title,
      audioUrl: track.audioUrl,
      description: track.description
    })
  })
  
  return (
    <main style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <AudioReactive tracks={tracks} />
    </main>
  )
}
