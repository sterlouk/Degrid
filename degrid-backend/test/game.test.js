import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.ADMIN_TOKEN = 'test-admin-token';

const { default: createApp } = await import('../app.js');
const game = await import('../services/gameState.js');

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => game.resetGame());

const call = async (method, path, { body, token, headers = {} } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const join = async (playerId) => (await call('POST', `/players/${playerId}/join`)).body.token;

/** Player 1 starts at (0,0). Claim (x,y) as player 1 and return the challenge response. */
const claim = async (token, x, y, playerId = 1) => {
  const req = await call('POST', `/players/${playerId}/request`, { token, body: { x, y } });
  if (req.status !== 200) return req;
  return call('POST', `/players/${playerId}/challenge`, { token, body: { challengeId: req.body.challengeId } });
};

describe('seats and authorization', () => {
  test('joining returns a token once; the seat cannot be taken twice', async () => {
    const first = await call('POST', '/players/1/join');
    assert.equal(first.status, 201);
    assert.match(first.body.token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal((await call('POST', '/players/1/join')).status, 409);
  });

  test('actions without a token are rejected', async () => {
    const res = await call('POST', '/players/1/request', { body: { x: 1, y: 0 } });
    assert.equal(res.status, 401);
  });

  test("a player's token cannot act for another player", async () => {
    const alice = await join(1);
    await join(2);
    const res = await call('PUT', '/players/2', { token: alice, body: { description: 'hacked' } });
    assert.equal(res.status, 403);
    assert.equal(game.findPlayer(2).description, '');
  });

  test('a forged token is rejected', async () => {
    await join(1);
    const res = await call('PUT', '/players/1', { token: 'not-the-real-token', body: { color: 'red' } });
    assert.equal(res.status, 403);
  });

  test('tokens are not exposed in player listings', async () => {
    const token = await join(1);
    const res = await call('GET', '/players');
    assert.ok(!JSON.stringify(res.body).includes(token));
    assert.equal(res.body.players[0].seatTaken, true);
  });
});

describe('game rules', () => {
  test('a winning center cell cannot be claimed without adjacency (instant-win bug)', async () => {
    const token = await join(1);
    const res = await call('POST', '/players/1/request', { token, body: { x: 4, y: 4 } });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /not adjacent/);
    assert.equal(game.getWinner(), null);
  });

  test('an adjacent free cell is always won and the turn passes', async () => {
    const token = await join(1);
    await join(2);
    const res = await claim(token, 1, 0);
    assert.equal(res.body.success, true);
    assert.equal(game.findCellByXY(1, 0).owner, 1);
    assert.equal(res.body.nextPlayer, 2);
  });

  test('cannot act out of turn', async () => {
    await join(1);
    const bob = await join(2);
    const res = await call('POST', '/players/2/request', { token: bob, body: { x: 1, y: 2 } });
    assert.equal(res.status, 403);
    assert.match(res.body.message, /Not your turn/);
  });

  test('a challenge requested on one turn cannot be played on a later turn', async () => {
    const alice = await join(1);
    const bob = await join(2);
    const req = await call('POST', '/players/1/request', { token: alice, body: { x: 1, y: 0 } });
    const { challengeId } = req.body;
    // Alice plays a different cell instead; turn passes to Bob, then back to Alice
    await claim(alice, 0, 1);
    await claim(bob, 1, 2, 2);
    const replay = await call('POST', '/players/1/challenge', { token: alice, body: { challengeId } });
    assert.equal(replay.status, 404);
  });

  test("turns skip seats nobody joined", async () => {
    const alice = await join(1);
    await join(5);
    const res = await claim(alice, 1, 0);
    assert.equal(res.body.nextPlayer, 5);
  });

  test('reaching a center cell through adjacent territory wins the game', async () => {
    const token = await join(1);
    // Walk from (0,0) to (4,4); with one seat, every turn is Alice's
    const path = [[1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]];
    let last;
    for (const [x, y] of path) last = await claim(token, x, y);
    assert.equal(last.body.winner, 1);
    const after = await call('POST', '/players/1/request', { token, body: { x: 5, y: 4 } });
    assert.equal(after.status, 403);
  });
});

describe('input validation', () => {
  test('rejects non-integer coordinates', async () => {
    const token = await join(1);
    for (const body of [{ x: '1', y: 0 }, { x: 1.5, y: 0 }, { x: null, y: 0 }]) {
      assert.equal((await call('POST', '/players/1/request', { token, body })).status, 400);
    }
  });

  test('rejects oversized descriptions and invalid colors', async () => {
    const token = await join(1);
    assert.equal((await call('PUT', '/players/1', { token, body: { description: 'x'.repeat(281) } })).status, 400);
    assert.equal((await call('PUT', '/players/1', { token, body: { color: 'red; background:url(x)' } })).status, 400);
    assert.equal((await call('PUT', '/players/1', { token, body: { color: '#00ff88', description: 'hi' } })).status, 200);
  });

  test('rejects malformed and oversized JSON without leaking internals', async () => {
    const token = await join(1);
    const bad = await call('PUT', '/players/1', { token, body: '{not json' });
    assert.equal(bad.status, 400);
    const big = await call('PUT', '/players/1', { token, body: { description: 'x'.repeat(20_000) } });
    assert.equal(big.status, 413);
  });
});

describe('admin reset', () => {
  test('requires the admin token', async () => {
    assert.equal((await call('POST', '/game/reset')).status, 403);
    const seatToken = await join(1);
    assert.equal((await call('POST', '/game/reset', { token: seatToken })).status, 403);
    assert.equal((await call('POST', '/game/reset', { token: 'test-admin-token' })).status, 200);
  });

  test('is disabled when ADMIN_TOKEN is not configured', async () => {
    const saved = process.env.ADMIN_TOKEN;
    delete process.env.ADMIN_TOKEN;
    try {
      assert.equal((await call('POST', '/game/reset', { token: 'anything' })).status, 403);
    } finally {
      process.env.ADMIN_TOKEN = saved;
    }
  });

  test('reset frees all seats', async () => {
    await join(1);
    await call('POST', '/game/reset', { token: 'test-admin-token' });
    assert.equal((await call('POST', '/players/1/join')).status, 201);
  });
});

describe('CORS', () => {
  test('only the configured origin is allowed', async () => {
    const allowed = await fetch(`${base}/grid`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const other = await fetch(`${base}/grid`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(other.headers.get('access-control-allow-origin'), null);
  });
});
