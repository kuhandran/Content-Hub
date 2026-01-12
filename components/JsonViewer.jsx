'use client';

import { useState } from 'react';
import styles from './JsonViewer.module.css';

export default function JsonViewer({ data, title = 'Data Viewer' }) {
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleKey = (key) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const renderValue = (value, key = '', depth = 0) => {
    if (value === null || value === undefined) {
      return <span className={styles.null}>null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className={styles.boolean}>{String(value)}</span>;
    }

    if (typeof value === 'number') {
      return <span className={styles.number}>{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className={styles.string}>"{value}"</span>;
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(key);
      return (
        <div className={styles.arrayContainer}>
          <button
            className={styles.toggleBtn}
            onClick={() => toggleKey(key)}
          >
            {isExpanded ? '▼' : '▶'} Array [{value.length}]
          </button>
          {isExpanded && (
            <div className={styles.arrayItems}>
              {value.map((item, idx) => (
                <div key={idx} className={styles.arrayItem}>
                  <span className={styles.arrayIndex}>[{idx}]</span>
                  {renderValue(item, `${key}-${idx}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expandedKeys.has(key);
      const objKeys = Object.keys(value);
      return (
        <div className={styles.objectContainer}>
          <button
            className={styles.toggleBtn}
            onClick={() => toggleKey(key)}
          >
            {isExpanded ? '▼' : '▶'} Object {`{${objKeys.length}}`}
          </button>
          {isExpanded && (
            <div className={styles.objectContent}>
              {objKeys.map((k) => (
                <div key={k} className={styles.objectProperty}>
                  <span className={styles.key}>{k}:</span>
                  <div className={styles.propertyValue}>
                    {renderValue(value[k], `${key}-${k}`, depth + 1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className={styles.viewer}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <input
          type="text"
          placeholder="Search..."
          className={styles.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className={styles.expandBtn}
          onClick={() => setExpandedKeys(new Set(Object.keys(data || {})))}
        >
          Expand All
        </button>
        <button
          className={styles.collapseBtn}
          onClick={() => setExpandedKeys(new Set())}
        >
          Collapse All
        </button>
      </div>
      <div className={styles.content}>
        {typeof data === 'object' && data !== null ? (
          renderValue(data, 'root')
        ) : (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
