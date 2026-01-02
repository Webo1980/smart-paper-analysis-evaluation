// src\app\api\github\save-evaluation\route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { token, data } = await req.json();
    
    const response = await fetch(
      `https://api.github.com/repos/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'update-evaluation',
          client_payload: {
            token,
            data: JSON.stringify(data),
            filename: `src/data/evaluations/${token}.json`
          }
        })
      }
    );
    console.log('GitHub API response status:', response.status, response);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}