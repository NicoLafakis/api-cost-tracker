import { useState, useEffect, useRef } from 'react';
import { useHouseholdContext } from '../context/HouseholdContext';
import QRCode from 'qrcode';

export function Share() {
  const { household, exportHousehold, importHousehold } = useHouseholdContext();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (household) {
      generateShareData();
    }
  }, [household]);

  const generateShareData = async () => {
    if (!household) return;

    // Create a compressed version of household data
    const data = exportHousehold();
    const encoded = btoa(encodeURIComponent(data));

    // For demo purposes, create a data URL (in production, this would be a server-hosted link)
    const url = `${window.location.origin}?data=${encoded.slice(0, 100)}...`;
    setShareUrl(url);

    // Generate QR code with the full data
    try {
      const qrUrl = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handleCopyLink = async () => {
    const data = exportHousehold();
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (!household) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `RoomSplit - ${household.name}`,
          text: 'Join our household on RoomSplit',
          url: shareUrl
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback to clipboard
      handleCopyLink();
    }
  };

  const handleExportFile = () => {
    const data = exportHousehold();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roomsplit-${household?.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const success = importHousehold(reader.result as string);
        if (success) {
          alert('Household imported successfully!');
        } else {
          alert('Failed to import. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportText = () => {
    if (importData.trim()) {
      const success = importHousehold(importData);
      if (success) {
        alert('Household imported successfully!');
        setImportData('');
        setShowImport(false);
      } else {
        alert('Failed to import. Please check the data format.');
      }
    }
  };

  if (!household) return null;

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2">
        <h1 className="text-2xl font-bold">Share Household</h1>
        <p className="text-gray-500">Invite roommates to join</p>
      </header>

      {/* QR Code */}
      <section className="card text-center">
        <h2 className="font-semibold mb-3">Scan to Import</h2>
        {qrCodeUrl ? (
          <div className="inline-block p-4 bg-white rounded-xl shadow-sm">
            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
          </div>
        ) : (
          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
            <span className="text-gray-400">Generating...</span>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-3">
          Other roommates can scan this to import your household
        </p>
      </section>

      {/* Share Actions */}
      <section className="card">
        <h2 className="font-semibold mb-3">Share Options</h2>
        <div className="space-y-2">
          <button
            onClick={handleShare}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>

          <button
            onClick={handleCopyLink}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Copied!' : 'Copy Data'}
          </button>

          <button
            onClick={handleExportFile}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export File
          </button>
        </div>
      </section>

      {/* Import */}
      <section className="card">
        <h2 className="font-semibold mb-3">Import Household</h2>
        <div className="space-y-2">
          <label className="btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import File
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowImport(!showImport)}
            className="btn-secondary w-full"
          >
            Paste Data
          </button>

          {showImport && (
            <div className="mt-2 space-y-2">
              <textarea
                className="input min-h-[100px] text-sm font-mono"
                placeholder="Paste household data here..."
                value={importData}
                onChange={e => setImportData(e.target.value)}
              />
              <button
                onClick={handleImportText}
                className="btn-primary w-full"
                disabled={!importData.trim()}
              >
                Import
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Info */}
      <section className="card bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-800 mb-1">How It Works</h3>
        <p className="text-sm text-blue-700">
          Share your household data with roommates so they can import it into their own RoomSplit app.
          Everyone will have the same starting point, then changes sync when you export/import again.
        </p>
      </section>
    </div>
  );
}
