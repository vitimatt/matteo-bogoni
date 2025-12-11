import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the full path from the catch-all route
    const audioPath = params.path.join('/')
    
    // Validate that this is a Sanity audio URL
    if (!audioPath.includes('cdn.sanity.io')) {
      return new NextResponse('Invalid audio source', { status: 400 })
    }

    // Construct the full URL
    const audioUrl = `https://${audioPath}`
    
    console.log('Proxying audio request to:', audioUrl)

    // Fetch the audio file from Sanity
    const response = await fetch(audioUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Next.js Audio Proxy',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch audio:', response.status, response.statusText)
      return new NextResponse('Audio not found', { status: response.status })
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer()
    
    // Get content type from the original response
    const contentType = response.headers.get('content-type') || 'audio/mpeg'

    // Return the audio with proper CORS headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error proxying audio:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
