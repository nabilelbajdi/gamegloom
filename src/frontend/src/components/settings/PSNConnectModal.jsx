import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { linkPSNAccount } from '../../api';

const PSNConnectModal = ({ onClose, onConnected }) => {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            setError('Please enter your PSN username');
            return;
        }

        if (username.length < 3 || username.length > 16) {
            setError('PSN username should be between 3 and 16 characters');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await linkPSNAccount(username.trim());
            onConnected();
        } catch (err) {
            setError(err.message || 'Failed to connect PSN account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl popup-animation">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🎮</span>
                        <h2 className="text-xl font-bold text-white">Connect PlayStation</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Info */}
                    <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-200">
                                <p className="font-medium mb-1">Public profile required</p>
                                <p className="text-blue-300/80">
                                    Your PSN profile and trophies must be set to public for this to work.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                PSN Username (Online ID)
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your PSN username"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                disabled={isLoading}
                                autoFocus
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                This is the name displayed on your PlayStation profile
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !username.trim()}
                            className="w-full py-3 bg-[var(--color-primary)] text-black font-semibold rounded-lg hover:bg-[#efcb83] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect PlayStation'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-xs text-gray-500 text-center">
                        PlayStation™ and PSN are trademarks of Sony Interactive Entertainment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PSNConnectModal;
