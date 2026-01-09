import React from 'react';
export default function JsonViewer({ data }) {
  if (!data) return <div className="text-slate-400">No data</div>;
  return (
    <pre className="bg-slate-900 text-green-200 rounded-lg p-4 overflow-auto text-xs" style={{ maxHeight: 400 }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
