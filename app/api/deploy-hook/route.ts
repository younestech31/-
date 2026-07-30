import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.DEPLOY_HOOK_SECRET;

  if (!secret || !authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const host = req.headers.get('host');
  if (!host) {
    return NextResponse.json({ error: 'Bad Request: Missing Host header' }, { status: 400 });
  }

  const allowedHostsStr = process.env.INDEXNOW_ALLOWED_HOSTS;
  if (!allowedHostsStr) {
    return NextResponse.json({ error: 'Server Error: INDEXNOW_ALLOWED_HOSTS environment variable is not configured' }, { status: 500 });
  }

  const allowedHosts = allowedHostsStr.split(',').map(h => h.trim());
  if (!allowedHosts.includes(host)) {
    return NextResponse.json({ error: `Forbidden: Host ${host} is not in the allowed list` }, { status: 400 });
  }

  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Server Error: INDEXNOW_KEY environment variable is not configured' }, { status: 500 });
  }

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
