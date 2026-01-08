export default function handler(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Sync Management Endpoint',
    modes: ['scan', 'pull', 'push'],
    timestamp: new Date().toISOString(),
  });
}
