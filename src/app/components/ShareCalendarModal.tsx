'use client';

import { useState } from 'react';

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: { id: string; name: string; color: string }[];
  events: { id: string; title: string; start_time: string; end_time: string; all_day: boolean; category: string; family_member_id?: string }[];
}

export default function ShareCalendarModal({ isOpen, onClose, familyMembers, events }: ShareCalendarModalProps) {
  const [shareMode, setShareMode] = useState<'link' | 'email'>('link');
  const [shareLink, setShareLink] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [shareTitle, setShareTitle] = useState('Family Calendar');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  // Generate share link
  async function generateLink() {
    setIsGenerating(true);
    try {
      // Create shareable data encoded in URL
      const shareData = {
        title: shareTitle,
        members: selectedMembers,
        // For a real implementation, this would be stored in the database
        // and a unique ID would be generated
        generatedAt: new Date().toISOString(),
      };
      
      // Encode the share data
      const encoded = btoa(JSON.stringify(shareData));
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/share?data=${encoded}`;
      
      setGeneratedLink(link);
      setShareLink(link);
    } catch (error) {
      console.error('Error generating link:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  // Copy link to clipboard
  function copyLink() {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  }

  // Toggle member selection
  function toggleMember(memberId: string) {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">📤 Share Calendar</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Share Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calendar Name
            </label>
            <input
              type="text"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder="e.g., Family Calendar"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Family Members to Include */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include Family Members
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMembers(selectedMembers.length === familyMembers.length ? [] : familyMembers.map(m => m.id))}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedMembers.length === familyMembers.length
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedMembers.includes(member.id)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedMembers.includes(member.id) ? { backgroundColor: member.color } : {}}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          {/* Share Mode Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Via
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShareMode('link')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  shareMode === 'link'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }}`}
              >
                🔗 Link
              </button>
              <button
                onClick={() => setShareMode('email')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  shareMode === 'email'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✉️ Email
              </button>
            </div>
          </div>

          {shareMode === 'link' ? (
            /* Link Mode */
            <div className="mb-4">
              {!generatedLink ? (
                <button
                  onClick={generateLink}
                  disabled={isGenerating}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Share Link'}
                </button>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyLink}
                      className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Anyone with this link can view (not edit) your calendar.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Email Mode */
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="family@example.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Note: Email sharing requires SMTP configuration. Use link sharing for now.
              </p>
            </div>
          )}

          {/* Preview */}
          {events.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Preview ({events.length} events)
              </h3>
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-2">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="text-sm text-gray-600 py-1">
                    • {event.title} - {new Date(event.start_time).toLocaleDateString()}
                  </div>
                ))}
                {events.length > 5 && (
                  <div className="text-xs text-gray-400">
                    +{events.length - 5} more events
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full mt-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
