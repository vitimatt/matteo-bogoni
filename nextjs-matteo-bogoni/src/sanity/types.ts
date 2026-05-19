export interface Track {
  _id: string
  title: string
  description?: string
  audioUrl?: string
}

export interface Project {
  _id: string
  title: string
  mediaType?: 'image' | 'video'
  mediaUrl?: string
}
