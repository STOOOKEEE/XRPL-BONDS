import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { returnUrl } = body

    console.log('🔧 API Route: Creating Xaman payload')
    console.log('📍 Return URL:', returnUrl)

    const apiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY

    if (!apiKey) {
      console.error('❌ API Key not found in environment')
      return NextResponse.json(
        { error: 'Xaman API Key not configured' },
        { status: 500 }
      )
    }

    console.log('🔑 API Key found:', apiKey.substring(0, 8) + '...')
    console.log('📤 Calling Xaman API...')

    const response = await fetch('https://xumm.app/api/v1/platform/payload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        txjson: {
          TransactionType: 'SignIn',
        },
        options: {
          return_url: {
            web: returnUrl,
          },
        },
      }),
    })

    console.log('📥 Xaman response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Xaman API error:', error)
      return NextResponse.json(
        { error: error.error?.message || `Error ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Payload created successfully:', data.uuid)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating Xaman payload:', error)
    return NextResponse.json(
      { error: 'Failed to create payload' },
      { status: 500 }
    )
  }
}
