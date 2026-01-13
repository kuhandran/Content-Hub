'use client';

import { useState, useEffect } from 'react';
import styles from './ControlPanel.module.css';
import JsonViewer from './JsonViewer';

const TABLES = [
  { id: 'collections', label: '📚 Collections', icon: '📚' },
  { id: 'config_files', label: '⚙️ Config Files', icon: '⚙️' },
  { id: 'data_files', label: '📄 Data Files', icon: '📄' },
  { id: 'static_files', label: '📦 Static Files', icon: '📦' },
  { id: 'images', label: '🖼️ Images', icon: '🖼️' },
  { id: 'javascript_files', label: '⚡ JavaScript', icon: '⚡' },
  { id: 'resumes', label: '📋 Resumes', icon: '📋' },
  { id: 'sync_manifest', label: '🔄 Sync Manifest', icon: '🔄' }
];

export default function ControlPanel() {
  console.log('[🎛️ ControlPanel] Component loaded');
  
  const [selectedTable, setSelectedTable] = useState('collections');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('view'); // view, create, edit
  const [formData, setFormData] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[🎛️ ControlPanel] 📋 useEffect triggered: selectedTable:', selectedTable, 'mode:', mode);
    if (mode === 'view') {
      console.log('[🎛️ ControlPanel] 🔄 Loading table data for mode=view');
      loadTableData();
    }
  }, [selectedTable, mode]);

  const loadTableData = async () => {
    console.log('[🎛️ ControlPanel] 🔄 loadTableData() starting for table:', selectedTable);
    try {
      setLoading(true);
      setError(null);
      console.log('[🎛️ ControlPanel] 📤 Fetching /api/admin/table/' + selectedTable);
      const response = await fetch(`/api/admin/table/${selectedTable}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('[🎛️ ControlPanel] 📥 Response status:', response.status);
      const data = await response.json();
      console.log('[🎛️ ControlPanel] ✅ JSON parsed, records count:', data.records?.length || 0);
      if (data.status === 'success') {
        setRecords(data.records || []);
        console.log('[🎛️ ControlPanel] ✅ Records loaded successfully:', data.records?.length || 0);
      } else {
        const errorMsg = data.error || 'Failed to load records';
        setError(errorMsg);
        console.error('[🎛️ ControlPanel] ❌ Error:', errorMsg);
        setRecords([]);
      }
    } catch (error) {
      console.error('[🎛️ ControlPanel] ❌ Exception in loadTableData:', error.message, error);
      setError(error.message);
      setRecords([]);
    } finally {
      setLoading(false);
      console.log('[🎛️ ControlPanel] ✅ loadTableData() completed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/table/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('✅ Record created successfully');
        setFormData({});
        setMode('view');
        loadTableData();
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('⚠️ Delete this record permanently?')) {
      try {
        const response = await fetch(`/api/admin/table/${selectedTable}/${recordId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert('✅ Record deleted');
          loadTableData();
        } else {
          alert('❌ Error: ' + data.error);
        }
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/table/${selectedTable}/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('✅ Record updated');
        setFormData({});
        setSelectedRecord(null);
        setMode('view');
        loadTableData();
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <div className={styles.controlPanel}>
      <h2>🎛️ Control Panel - Table Management</h2>

      {/* Table Selector */}
      <div className={styles.tableSelector}>
        {TABLES.map(table => (
          <button
            key={table.id}
            className={`${styles.tableButton} ${selectedTable === table.id ? styles.active : ''}`}
            onClick={() => {
              console.log('[🎛️ ControlPanel] 📚 Table selected:', table.id, '(' + table.label + ')');
              setSelectedTable(table.id);
              setMode('view');
            }}
          >
            {table.icon} {table.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button 
          className={styles.btn}
          onClick={() => {
            console.log('[🎛️ ControlPanel] ➕ Create New Record button clicked');
            setMode('create');
            setFormData({});
          }}
        >
          ➕ Create New Record
        </button>
        <button 
          className={styles.btn}
          onClick={loadTableData}
        >
          🔄 Refresh Data
        </button>
        <span className={styles.recordCount}>
          {records.length} records in {selectedTable}
        </span>
      </div>

      {/* Forms */}
      {mode === 'create' && (
        <div className={styles.formContainer}>
          <h3>➕ Create New Record</h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formGroup}>
              <label>Table: {selectedTable}</label>
            </div>
            
            {selectedTable === 'collections' && (
              <>
                <div className={styles.formGroup}>
                  <label>Language</label>
                  <select value={formData.language || ''} onChange={(e) => setFormData({...formData, language: e.target.value})} required>
                    <option value="">Select Language</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ar-AE">Arabic</option>
                    <option value="hi">Hindi</option>
                    <option value="id">Indonesian</option>
                    <option value="my">Burmese</option>
                    <option value="si">Sinhala</option>
                    <option value="ta">Tamil</option>
                    <option value="th">Thai</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} required>
                    <option value="">Select Type</option>
                    <option value="config">Config</option>
                    <option value="data">Data</option>
                  </select>
                </div>
              </>
            )}

            {['config_files', 'data_files', 'static_files'].includes(selectedTable) && (
              <>
                <div className={styles.formGroup}>
                  <label>File Name</label>
                  <input type="text" placeholder="filename.json" value={formData.filename || ''} onChange={(e) => setFormData({...formData, filename: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label>File Path</label>
                  <input type="text" placeholder="/path/to/file" value={formData.file_path || ''} onChange={(e) => setFormData({...formData, file_path: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label>File Hash (SHA-256)</label>
                  <input type="text" placeholder="abc123..." value={formData.file_hash || ''} onChange={(e) => setFormData({...formData, file_hash: e.target.value})} />
                </div>
              </>
            )}

            {selectedTable === 'images' && (
              <>
                <div className={styles.formGroup}>
                  <label>Image Name</label>
                  <input type="text" placeholder="image.png" value={formData.filename || ''} onChange={(e) => setFormData({...formData, filename: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Image Path</label>
                  <input type="text" placeholder="/images/..." value={formData.file_path || ''} onChange={(e) => setFormData({...formData, file_path: e.target.value})} required />
                </div>
              </>
            )}

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>✅ Create</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setMode('view')}>❌ Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Records Table */}
      {mode === 'view' && (
        <div className={styles.tableContainer}>
          <h3>📋 Records ({records.length})</h3>
          {error && <div className={styles.error}>{error}</div>}
          {loading ? (
            <p>⏳ Loading...</p>
          ) : records.length === 0 ? (
            <p>No records found. <button onClick={() => setMode('create')}>Create one</button></p>
          ) : (
            <div className={styles.recordsView}>
              <JsonViewer data={records} title={`${selectedTable} - ${records.length} Records`} />
              <div className={styles.recordsList}>
                {records.map((record, idx) => (
                  <div key={idx} className={styles.recordRow}>
                    <div className={styles.recordInfo}>
                      <strong>{record.filename || record.language || record.id || `Record ${idx + 1}`}</strong>
                      <small>{record.file_path || record.type || JSON.stringify(record).substring(0, 80)}</small>
                    </div>
                    <div className={styles.recordActions}>
                      <button className={styles.editBtn} onClick={() => {
                        setSelectedRecord(record);
                        setFormData(record);
                        setMode('edit');
                      }}>✏️ Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(record.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Form */}
      {mode === 'edit' && selectedRecord && (
        <div className={styles.formContainer}>
          <h3>✏️ Edit Record</h3>
          <form onSubmit={handleUpdate}>
            {Object.entries(selectedRecord).map(([key, value]) => (
              <div key={key} className={styles.formGroup}>
                <label>{key}</label>
                <input 
                  type="text" 
                  value={formData[key] || ''} 
                  onChange={(e) => setFormData({...formData, [key]: e.target.value})}
                />
              </div>
            ))}
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>✅ Update</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setMode('view')}>❌ Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
