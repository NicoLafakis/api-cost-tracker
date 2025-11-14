import { useState } from 'react';
import { apiKeyService } from '../services/api';

interface AddKeyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddKeyModal({ onClose, onSuccess }: AddKeyModalProps) {
  const [formData, setFormData] = useState({
    label: '',
    provider: 'openai',
    apiKey: '',
    workspace: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiKeyService.add({
        label: formData.label,
        provider: formData.provider,
        apiKey: formData.apiKey,
        workspace: formData.workspace || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add API Key
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Label</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., Production Key"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Provider</label>
            <select
              className="input w-full"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              required
            >
              <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="gemini">Google (Gemini)</option>
              <option value="perplexity">Perplexity</option>
            </select>
          </div>

          <div>
            <label className="label">API Key</label>
            <input
              type="password"
              className="input w-full font-mono"
              placeholder="sk-..."
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your API key will be encrypted and stored securely
            </p>
          </div>

          <div>
            <label className="label">Workspace (Optional)</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., Development, Staging"
              value={formData.workspace}
              onChange={(e) => setFormData({ ...formData, workspace: e.target.value })}
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
