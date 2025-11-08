import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { payloadId: string } }
) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Xaman API Key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://xumm.app/api/v1/platform/payload/${params.payloadId}`,
      {
        headers: {
          'X-API-Key': apiKey,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get payload status' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error getting Xaman payload status:', error)
    return NextResponse.json(
      { error: 'Failed to get payload status' },
      { status: 500 }
    )
  }
}
