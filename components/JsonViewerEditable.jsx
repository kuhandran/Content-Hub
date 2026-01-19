'use client';

import { useState } from 'react';
import styles from './JsonViewerEditable.module.css';

/**
 * JsonViewerEditable Component
 * Displays and allows editing of JSON content with validation
 * 
 * Props:
 * - content: The JSON object to display and edit
 * - onContentChange: Callback when content is modified
 */
export default function JsonViewerEditable({ content, onContentChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(JSON.stringify(content, null, 2));
  const [parseError, setParseError] = useState(null);

  const handleEditToggle = () => {
    if (isEditing) {
      // Validate JSON before saving
      try {
        const parsed = JSON.parse(editValue);
        setParseError(null);
        setIsEditing(false);
        onContentChange(parsed);
      } catch (error) {
        setParseError(`Invalid JSON: ${error.message}`);
      }
    } else {
      setIsEditing(true);
      setEditValue(JSON.stringify(content, null, 2));
      setParseError(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(JSON.stringify(content, null, 2));
    setParseError(null);
  };

  return (
    <div className={styles.jsonViewer}>
      <div className={styles.controls}>
        <button
          className={styles.editButton}
          onClick={handleEditToggle}
        >
          {isEditing ? '✓ Save' : '✎ Edit'}
        </button>
        {isEditing && (
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            ✕ Cancel
          </button>
        )}
      </div>

      {parseError && (
        <div className={styles.errorMessage}>
          ⚠️ {parseError}
        </div>
      )}

      {isEditing ? (
        <textarea
          className={styles.textarea}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            // Try to parse and show error if invalid
            try {
              JSON.parse(e.target.value);
              setParseError(null);
            } catch (error) {
              setParseError(`Invalid JSON: ${error.message}`);
            }
          }}
          spellCheck="false"
        />
      ) : (
        <pre className={styles.jsonDisplay}>
          <code>{JSON.stringify(content, null, 2)}</code>
        </pre>
      )}

      <div className={styles.stats}>
        <span>Size: {JSON.stringify(content).length} bytes</span>
        <span>Keys: {Object.keys(content).length}</span>
      </div>
    </div>
  );
}
