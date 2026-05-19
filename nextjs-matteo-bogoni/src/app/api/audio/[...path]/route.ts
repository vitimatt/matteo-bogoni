import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const audioPath = params.path.join('/')

    if (!audioPath.includes('cdn.sanity.io')) {
      return new NextResponse('Invalid audio source', { status: 400 })
    }

    const audioUrl = `https://${audioPath}`
    const rangeHeader = request.headers.get('range')

    const upstreamHeaders: HeadersInit = {
      'User-Agent': 'Next.js Audio Proxy',
    }
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader
    }

    const response = await fetch(audioUrl, {
      method: 'GET',
      headers: upstreamHeaders,
    })

    if (!response.ok && response.status !== 206) {
      return new NextResponse('Audio not found', { status: response.status })
    }

    const headers = new Headers(corsHeaders)
    const contentType = response.headers.get('content-type')
    if (contentType) headers.set('Content-Type', contentType)

    const contentLength = response.headers.get('content-length')
    if (contentLength) headers.set('Content-Length', contentLength)

    const contentRange = response.headers.get('content-range')
    if (contentRange) headers.set('Content-Range', contentRange)

    const acceptRanges = response.headers.get('accept-ranges')
    headers.set('Accept-Ranges', acceptRanges || 'bytes')
    headers.set('Cache-Control', 'public, max-age=86400, immutable')

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    })
  } catch (error) {
    console.error('Error proxying audio:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400',
    },
  })
}
