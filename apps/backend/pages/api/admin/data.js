export default function handler(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Data Operations Endpoint',
    actions: ['pump', 'clear'],
    timestamp: new Date().toISOString()
  });
}
