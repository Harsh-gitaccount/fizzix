// k6 load test for Fizzix
// Run: k6 run scripts/loadtest.js
// Install k6: https://k6.io/docs/get-started/installation/

import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // 1. Load home page
  const home = http.get(BASE_URL + '/')
  check(home, {
    'home status 200': (r) => r.status === 200,
    'home has content': (r) => r.body.length > 100,
  })

  sleep(1)

  // 2. Load static JS chunk (simulates returning user with cache miss)
  const staticRes = http.get(BASE_URL + '/_next/static/chunks/webpack.js')
  check(staticRes, {
    'static chunk loads': (r) => r.status === 200 || r.status === 304,
  })

  // 3. POST quiz results batch
  const payload = JSON.stringify({
    results: [
      {
        sessionId: `load-test-${__VU}`,
        topicId: 'projectile-motion',
        questionId: 'pm-1',
        selected: 0,
        correct: true,
        difficulty: 'easy',
        timestamp: Date.now(),
      },
    ],
  })

  const quizRes = http.post(BASE_URL + '/api/quiz/results/batch', payload, {
    headers: { 'Content-Type': 'application/json' },
  })
  check(quizRes, {
    'quiz batch 200': (r) => r.status === 200,
    'quiz batch not rate limited': (r) => r.status !== 429,
  })

  sleep(Math.random() * 2 + 1)
}
