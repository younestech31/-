import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.DEPLOY_HOOK_SECRET;

  if (!secret || !authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const host = req.headers.get('host') || 'mawarith.dz';
  const key = process.env.INDEXNOW_KEY || 'indexnow-key';
  const urlList = [
    `https://${host}/`,
    `https://${host}/faq`,
    `https://${host}/how-to`,
  ];

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList,
      }),
    });

    return NextResponse.json({
      success: true,
      indexNowStatus: res.status,
      submittedUrls: urlList,
    });
  } catch (err) {
    console.error('IndexNow ping error:', err);
    return NextResponse.json(
      { error: 'Failed to submit to IndexNow', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
