import { NextResponse } from 'next/server';
const users = require('../../../../lib/users');

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return NextResponse.json({ status: 'error', error: 'Missing username/password' }, { status: 400 });
    const existing = await users.findUser(username);
    if (existing) return NextResponse.json({ status: 'error', error: 'User exists' }, { status: 409 });
    const created = await users.createUser(username, password);
    return NextResponse.json({ status: 'success', user: { id: created?.id, username: created?.username } });
  } catch (e) {
    return NextResponse.json({ status: 'error', error: e.message }, { status: 500 });
  }
}
