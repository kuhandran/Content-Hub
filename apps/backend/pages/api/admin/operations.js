export default function handler(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Admin Operations Endpoint',
    operations: ['createdb', 'deletedb', 'pumpdata', 'syncopublic', 'status'],
    timestamp: new Date().toISOString()
  });
}
