import assert from 'node:assert/strict'
import test from 'node:test'

import { getAllowedVenueImageUrl } from '../src/lib/safeVenueImageUrl.ts'

const ORIGIN = 'https://asemos.tr'

test('allows same-origin and approved HTTPS image hosts', () => {
  assert.equal(
    getAllowedVenueImageUrl('/images/venue.jpg', ORIGIN),
    'https://asemos.tr/images/venue.jpg',
  )
  assert.equal(
    getAllowedVenueImageUrl('https://images.unsplash.com/photo-1', ORIGIN),
    'https://images.unsplash.com/photo-1',
  )
  assert.equal(
    getAllowedVenueImageUrl('https://api.asemos.tr/api/v1/places/1/photo', ORIGIN),
    'https://api.asemos.tr/api/v1/places/1/photo',
  )
})

test('rejects executable and non-HTTPS protocols', () => {
  assert.equal(getAllowedVenueImageUrl('javascript:alert(1)', ORIGIN), null)
  assert.equal(getAllowedVenueImageUrl('data:image/svg+xml,<svg onload=alert(1)>', ORIGIN), null)
  assert.equal(getAllowedVenueImageUrl('http://images.unsplash.com/photo-1', ORIGIN), null)
})

test('rejects lookalike and unapproved hosts', () => {
  assert.equal(getAllowedVenueImageUrl('https://images.unsplash.com.evil.example/x.jpg', ORIGIN), null)
  assert.equal(getAllowedVenueImageUrl('https://evil.example/x.jpg', ORIGIN), null)
})

test('allows HTTP only for local development hosts', () => {
  assert.equal(
    getAllowedVenueImageUrl('http://localhost:8000/photo.jpg', 'http://localhost:5173'),
    'http://localhost:8000/photo.jpg',
  )
})
