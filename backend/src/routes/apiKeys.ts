import { Router, Request, Response } from 'express';
import { query } from '../database/connection';
import { encrypt, decrypt } from '../utils/encryption';
import { getClient } from '../services/apiClients';

const router = Router();

interface ApiKey {
  id: number;
  label: string;
  provider: 'openai' | 'anthropic';
  workspace: string | null;
  is_active: boolean;
  created_at: string;
  last_validated_at: string | null;
}

// Get all API keys (without exposing actual keys)
router.get('/', async (req: Request, res: Response) => {
  try {
    const keys = await query<ApiKey[]>(
      'SELECT id, label, provider, workspace, is_active, created_at, last_validated_at FROM api_keys WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(keys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Add new API key
router.post('/', async (req: Request, res: Response) => {
  try {
    const { label, provider, apiKey, workspace } = req.body;

    if (!label || !provider || !apiKey) {
      return res.status(400).json({ error: 'Label, provider, and API key are required' });
    }

    if (provider !== 'openai' && provider !== 'anthropic') {
      return res.status(400).json({ error: 'Provider must be openai or anthropic' });
    }

    // Validate the API key
    const client = getClient(provider);
    const isValid = await client.validateKey(apiKey);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid API key' });
    }

    // Encrypt and store
    const encryptedKey = encrypt(apiKey);
    const result = await query<any>(
      'INSERT INTO api_keys (label, provider, encrypted_key, workspace, last_validated_at) VALUES (?, ?, ?, ?, NOW())',
      [label, provider, encryptedKey, workspace || null]
    );

    res.status(201).json({
      id: result.insertId,
      label,
      provider,
      workspace,
      message: 'API key added successfully',
    });
  } catch (error) {
    console.error('Error adding API key:', error);
    res.status(500).json({ error: 'Failed to add API key' });
  }
});

// Update API key label/workspace
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, workspace } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (label !== undefined) {
      updates.push('label = ?');
      values.push(label);
    }

    if (workspace !== undefined) {
      updates.push('workspace = ?');
      values.push(workspace);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(id);

    await query(
      `UPDATE api_keys SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'API key updated successfully' });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Deactivate API key (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('UPDATE api_keys SET is_active = false WHERE id = ?', [id]);

    res.json({ message: 'API key deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating API key:', error);
    res.status(500).json({ error: 'Failed to deactivate API key' });
  }
});

// Revalidate an API key
router.post('/:id/validate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const keys = await query<any[]>(
      'SELECT encrypted_key, provider FROM api_keys WHERE id = ? AND is_active = true',
      [id]
    );

    if (keys.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const { encrypted_key, provider } = keys[0];
    const apiKey = decrypt(encrypted_key);

    const client = getClient(provider);
    const isValid = await client.validateKey(apiKey);

    if (isValid) {
      await query('UPDATE api_keys SET last_validated_at = NOW() WHERE id = ?', [id]);
    }

    res.json({ valid: isValid });
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Failed to validate API key' });
  }
});

export default router;
