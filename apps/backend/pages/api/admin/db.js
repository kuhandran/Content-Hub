export default function handler(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Database Management Endpoint',
    actions: ['create', 'delete', 'drop'],
    timestamp: new Date().toISOString()
  });
}
