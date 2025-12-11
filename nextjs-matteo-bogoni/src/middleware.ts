import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CORS for all requests
  const response = NextResponse.next()

  // Get the origin from the request
  const origin = request.headers.get('origin')
  
  // Define allowed origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3333',
    'https://matteo-bogoni.vercel.app', // Add your production domain
    'https://cdn.sanity.io', // Sanity CDN
    'https://cdnjs.cloudflare.com', // p5.js CDN
  ]

  // Check if the origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)

  // Set CORS headers
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (origin === null) {
    // Allow requests with no origin (e.g., same-origin requests)
    response.headers.set('Access-Control-Allow-Origin', '*')
  }

  response.headers.set(
    'Access-Control-Allow-Credentials', 
    'true'
  )
  
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  )
  
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma'
  )

  response.headers.set(
    'Access-Control-Expose-Headers',
    'Content-Length, X-Total-Count'
  )

  response.headers.set(
    'Access-Control-Max-Age',
    '86400' // 24 hours
  )

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: response.headers,
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - but include our audio proxy
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/audio|_next/static|_next/image|favicon.ico).*)',
  ],
}
