import { NextResponse } from 'next/server';

export default function handler(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Backend API is running',
    endpoint: '/api',
    timestamp: new Date().toISOString()
  });
}
