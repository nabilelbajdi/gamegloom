import React from 'react';
import { CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import BrandLogo from './BrandLogo';

/**
 * IntegrationCard - Clean, minimal integration row for Settings
 */
const IntegrationCard = ({
    platform,
    name,
    description,
    connected = false,
    username,
    lastSynced,
    loading = false,
    onConnect,
    onDisconnect,
    onSync,
}) => {
    return (
        <div className="py-6 border-b border-[var(--color-gray-800)] last:border-b-0">
            <div className="flex items-center justify-between gap-6">
                {/* Left: Logo + Info */}
                <div className="flex items-center gap-4">
                    <BrandLogo
                        platform={platform}
                        size={28}
                        connected={connected}
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${connected ? 'text-white' : 'text-gray-400'}`}>
                                {name}
                            </h3>
                            {connected && (
                                <CheckCircle size={14} className="text-emerald-500" />
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {connected && username ? (
                                <span className="text-gray-500">{username}</span>
                            ) : (
                                description
                            )}
                        </p>
                    </div>
                </div>

                {/* Right: Actions as text links */}
                <div className="flex items-center gap-4">
                    {connected ? (
                        <>
                            <button
                                onClick={onSync}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
                            >
                                {loading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <RefreshCw size={14} />
                                )}
                                Manage
                            </button>
                            <button
                                onClick={onDisconnect}
                                disabled={loading}
                                className="text-sm text-gray-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                            >
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onConnect}
                            disabled={loading}
                            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Connecting...' : 'Connect'}
                        </button>
                    )}
                </div>
            </div>

            {/* Last Synced - subtle line */}
            {connected && lastSynced && (
                <p className="text-xs text-gray-600 mt-2 ml-11">
                    Last synced {lastSynced}
                </p>
            )}
        </div>
    );
};

export default IntegrationCard;
