import React, { useState } from 'react';
import Modal from './Modal';
import { useSettings } from '../../hooks/useSettings';
import { AppSettings } from '../../types/settings';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const { settings, saveSettings } = useSettings();
  const [formData, setFormData] = useState<Partial<AppSettings>>(settings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(formData);
    onClose();
  };

  const handleChange = (key: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <form onSubmit={handleSubmit} className="config-form">
        <div className="form-group">
          <label>Theme:</label>
          <select
            value={formData.theme || 'light'}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.autoSave || false}
              onChange={(e) => handleChange('autoSave', e.target.checked)}
            />
            Auto-save changes
          </label>
        </div>

        <div className="form-group">
          <label>Default Language:</label>
          <input
            type="text"
            value={formData.defaultLanguage || ''}
            onChange={(e) => handleChange('defaultLanguage', e.target.value)}
            placeholder="en"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </Modal>
  );
};

export default ConfigModal;