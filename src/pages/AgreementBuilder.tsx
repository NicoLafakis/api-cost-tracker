import { useState, useRef } from 'react';
import { useHouseholdContext } from '../context/HouseholdContext';
import { Agreement, AgreementSection } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function AgreementBuilder() {
  const { household, updateAgreement } = useHouseholdContext();
  const agreementRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [agreement, setAgreement] = useState<Agreement>(
    household?.agreement || {
      guestPolicy: 'Guests may stay up to 3 consecutive nights without prior approval. Longer stays require roommate consent and may incur additional utility costs.',
      paymentDeadline: 'Rent and utilities are due by the 1st of each month. Late payments incur a $10 fee per day.',
      choreRotation: 'Common areas (kitchen, bathroom, living room) are cleaned on a weekly rotating basis. Each roommate is responsible for their own bedroom.',
      quietHours: 'Quiet hours are from 10 PM to 8 AM on weekdays, and 12 AM to 10 AM on weekends.',
      customSections: [],
      signatures: []
    }
  );

  if (!household) return null;

  const handleSave = () => {
    updateAgreement(agreement);
  };

  const handleAddSection = () => {
    setAgreement(prev => ({
      ...prev,
      customSections: [...prev.customSections, { title: '', content: '' }]
    }));
  };

  const handleUpdateSection = (index: number, field: keyof AgreementSection, value: string) => {
    setAgreement(prev => ({
      ...prev,
      customSections: prev.customSections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const handleRemoveSection = (index: number) => {
    setAgreement(prev => ({
      ...prev,
      customSections: prev.customSections.filter((_, i) => i !== index)
    }));
  };

  const handleSign = (roommateId: string) => {
    const existingSignature = agreement.signatures.find(s => s.roommateId === roommateId);
    if (existingSignature) return;

    setAgreement(prev => ({
      ...prev,
      signatures: [...prev.signatures, { roommateId, signedAt: new Date().toISOString() }]
    }));
  };

  const handleExportPDF = async () => {
    if (!agreementRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(agreementRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${household.name.replace(/\s+/g, '-')}-agreement.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
    setIsExporting(false);
  };

  return (
    <div className="p-4 space-y-4">
      <header className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agreement</h1>
          <p className="text-gray-500">Roommate house rules</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="btn-secondary text-sm">
            Save
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </header>

      <div ref={agreementRef} className="space-y-4 bg-white p-4 rounded-xl">
        <div className="text-center border-b pb-4">
          <h2 className="text-xl font-bold">{household.name}</h2>
          <p className="text-gray-500">Roommate Agreement</p>
        </div>

        {/* Guest Policy */}
        <section className="card">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">🏠</span> Guest Policy
          </h3>
          <textarea
            className="input min-h-[80px] text-sm"
            value={agreement.guestPolicy}
            onChange={e => setAgreement(prev => ({ ...prev, guestPolicy: e.target.value }))}
          />
        </section>

        {/* Payment Deadline */}
        <section className="card">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">💰</span> Payment Deadline
          </h3>
          <textarea
            className="input min-h-[80px] text-sm"
            value={agreement.paymentDeadline}
            onChange={e => setAgreement(prev => ({ ...prev, paymentDeadline: e.target.value }))}
          />
        </section>

        {/* Chore Rotation */}
        <section className="card">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">🧹</span> Chore Rotation
          </h3>
          <textarea
            className="input min-h-[80px] text-sm"
            value={agreement.choreRotation}
            onChange={e => setAgreement(prev => ({ ...prev, choreRotation: e.target.value }))}
          />
        </section>

        {/* Quiet Hours */}
        <section className="card">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">🔇</span> Quiet Hours
          </h3>
          <textarea
            className="input min-h-[80px] text-sm"
            value={agreement.quietHours}
            onChange={e => setAgreement(prev => ({ ...prev, quietHours: e.target.value }))}
          />
        </section>

        {/* Custom Sections */}
        {agreement.customSections.map((section, index) => (
          <section key={index} className="card">
            <div className="flex items-start justify-between gap-2 mb-2">
              <input
                type="text"
                className="input font-semibold"
                placeholder="Section Title"
                value={section.title}
                onChange={e => handleUpdateSection(index, 'title', e.target.value)}
              />
              <button
                onClick={() => handleRemoveSection(index)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              className="input min-h-[80px] text-sm"
              placeholder="Section content..."
              value={section.content}
              onChange={e => handleUpdateSection(index, 'content', e.target.value)}
            />
          </section>
        ))}

        <button
          onClick={handleAddSection}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
        >
          + Add Custom Section
        </button>

        {/* Signatures */}
        <section className="card">
          <h3 className="font-semibold mb-3">Signatures</h3>
          <div className="space-y-2">
            {household.roommates.map(roommate => {
              const signature = agreement.signatures.find(s => s.roommateId === roommate.id);
              return (
                <div key={roommate.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: roommate.color }}
                    >
                      {roommate.name[0]}
                    </div>
                    <span className="font-medium">{roommate.name}</span>
                  </div>
                  {signature ? (
                    <div className="text-right">
                      <p className="text-green-600 text-sm font-medium">Signed ✓</p>
                      <p className="text-xs text-gray-500">
                        {new Date(signature.signedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSign(roommate.id)}
                      className="text-sm text-primary-600 font-medium hover:text-primary-700"
                    >
                      Sign
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
