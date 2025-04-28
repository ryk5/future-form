import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
  }
  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    });
    const data = await openaiRes.json();
    // Try to extract the JSON array from the response
    let cleaned: any[] = [];
    if (data.choices && data.choices[0]?.message?.content) {
      const match = data.choices[0].message.content.match(/\[([\s\S]*?)\]/);
      if (match) {
        try {
          cleaned = JSON.parse('[' + match[1] + ']');
        } catch {}
      }
    }
    return NextResponse.json({ cleaned });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to call OpenAI API' }, { status: 500 });
  }
} 