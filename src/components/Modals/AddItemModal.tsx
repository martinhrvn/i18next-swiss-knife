import React, { useState } from 'react';
import Modal from './Modal';
import { useTranslations } from '../../hooks/useTranslations';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentKey?: string;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, parentKey = '' }) => {
  const { addTranslationNode } = useTranslations();
  const [formData, setFormData] = useState({
    key: '',
    value: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key.trim()) return;
    
    addTranslationNode(parentKey, formData.key, formData.value);
    
    setFormData({ key: '', value: '' });
    onClose();
  };

  const handleChange = (field: 'key' | 'value', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Translation">
      <form onSubmit={handleSubmit} className="add-item-form">
        <div className="form-group">
          <label>Key:</label>
          <input
            type="text"
            value={formData.key}
            onChange={(e) => handleChange('key', e.target.value)}
            placeholder="translation.key"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Value:</label>
          <textarea
            value={formData.value}
            onChange={(e) => handleChange('value', e.target.value)}
            placeholder="Translation value"
            rows={4}
          />
        </div>

        {parentKey && (
          <div className="form-info">
            <p>Parent: {parentKey}</p>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!formData.key.trim()}>
            Add Translation
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddItemModal;