import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from './app.js';

describe('API smoke tests', () => {
  it('returns healthy status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('validates invalid register payload', async () => {
    const response = await request(app).post('/api/auth/register').send({});
    expect(response.status).toBe(400);
  });
});
