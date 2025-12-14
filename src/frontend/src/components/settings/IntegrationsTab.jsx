import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchIntegrationStatus, unlinkPlatform, getSteamAuthUrl, linkSteamAccount, clearAllGames } from '../../api';
import { Loader2 } from 'lucide-react';
import PSNConnectModal from './PSNConnectModal';
import IntegrationCard from '../common/IntegrationCard';

const IntegrationsTab = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState({ steam: null, psn: null });
    const [isLoading, setIsLoading] = useState(true);
    const [showPSNModal, setShowPSNModal] = useState(false);
    const [unlinkingPlatform, setUnlinkingPlatform] = useState(null);
    const [connectingPlatform, setConnectingPlatform] = useState(null);
    const [isClearingLibrary, setIsClearingLibrary] = useState(false);

    const loadStatus = async () => {
        try {
            setIsLoading(true);
            const data = await fetchIntegrationStatus();
            setStatus(data);
        } catch (error) {
            console.error('Failed to load integration status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
        handleSteamCallback();
    }, []);

    const handleSteamCallback = async () => {
        const steamCallback = searchParams.get('steam_callback');
        const openidClaimedId = searchParams.get('openid.claimed_id');

        if (steamCallback && openidClaimedId) {
            const openidParams = {
                openid_ns: searchParams.get('openid.ns') || '',
                openid_mode: searchParams.get('openid.mode') || '',
                openid_op_endpoint: searchParams.get('openid.op_endpoint') || '',
                openid_claimed_id: searchParams.get('openid.claimed_id') || '',
                openid_identity: searchParams.get('openid.identity') || '',
                openid_return_to: searchParams.get('openid.return_to') || '',
                openid_response_nonce: searchParams.get('openid.response_nonce') || '',
                openid_assoc_handle: searchParams.get('openid.assoc_handle') || '',
                openid_signed: searchParams.get('openid.signed') || '',
                openid_sig: searchParams.get('openid.sig') || '',
            };

            try {
                setConnectingPlatform('steam');
                await linkSteamAccount(openidParams);
                await loadStatus();
                alert('Steam account linked successfully!');
            } catch (error) {
                console.error('Failed to link Steam:', error);
                alert(`Failed to link Steam: ${error.message}`);
            } finally {
                setConnectingPlatform(null);
            }
            setSearchParams({});
        }
    };

    const handleConnectSteam = async () => {
        try {
            setConnectingPlatform('steam');
            const { auth_url } = await getSteamAuthUrl();
            window.location.href = auth_url;
        } catch (error) {
            console.error('Failed to get Steam auth URL:', error);
            alert(`Failed to connect Steam: ${error.message}`);
            setConnectingPlatform(null);
        }
    };

    const handleUnlink = async (platform) => {
        if (!confirm(`Disconnect ${platform.toUpperCase()}?`)) {
            return;
        }

        try {
            setUnlinkingPlatform(platform);
            await unlinkPlatform(platform);
            await loadStatus();
        } catch (error) {
            console.error(`Failed to unlink ${platform}:`, error);
            alert(`Failed to disconnect. Please try again.`);
        } finally {
            setUnlinkingPlatform(null);
        }
    };

    const handlePSNConnected = () => {
        setShowPSNModal(false);
        loadStatus();
    };

    const openImportPage = (platform) => {
        navigate(`/sync/${platform}`);
    };

    const handleClearLibrary = async () => {
        const doubleConfirm = prompt('Type DELETE to clear your entire library:');
        if (doubleConfirm !== 'DELETE') return;

        try {
            setIsClearingLibrary(true);
            const result = await clearAllGames();
            alert(result.message || `Cleared ${result.count} games.`);
        } catch (error) {
            alert(`Failed to clear library: ${error.message}`);
        } finally {
            setIsClearingLibrary(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="max-w-xl">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-lg font-medium text-white mb-1">
                    Platforms
                </h2>
                <p className="text-sm text-gray-500">
                    Connect your accounts to import games and track playtime.
                </p>
            </div>

            {/* Integration List */}
            <div>
                <IntegrationCard
                    platform="steam"
                    name="Steam"
                    description="Import your Steam library"
                    connected={!!status.steam}
                    username={status.steam?.platform_username || status.steam?.platform_user_id}
                    lastSynced={status.steam?.last_synced_at ? new Date(status.steam.last_synced_at).toLocaleDateString() : null}
                    loading={connectingPlatform === 'steam' || unlinkingPlatform === 'steam'}
                    onConnect={handleConnectSteam}
                    onDisconnect={() => handleUnlink('steam')}
                    onSync={() => openImportPage('steam')}
                />

                <IntegrationCard
                    platform="psn"
                    name="PlayStation"
                    description="Import PlayStation games"
                    connected={!!status.psn}
                    username={status.psn?.platform_username || status.psn?.platform_user_id}
                    lastSynced={status.psn?.last_synced_at ? new Date(status.psn.last_synced_at).toLocaleDateString() : null}
                    loading={connectingPlatform === 'psn' || unlinkingPlatform === 'psn'}
                    onConnect={() => setShowPSNModal(true)}
                    onDisconnect={() => handleUnlink('psn')}
                    onSync={() => openImportPage('psn')}
                />
            </div>

            {/* Danger Zone - minimal */}
            <div className="mt-12 pt-8 border-t border-[var(--color-gray-800)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-medium text-gray-400">Clear library</h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                            Remove all games from your collection
                        </p>
                    </div>
                    <button
                        onClick={handleClearLibrary}
                        disabled={isClearingLibrary}
                        className="text-sm text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                        {isClearingLibrary ? 'Clearing...' : 'Clear all'}
                    </button>
                </div>
            </div>

            {showPSNModal && (
                <PSNConnectModal
                    onClose={() => setShowPSNModal(false)}
                    onConnected={handlePSNConnected}
                />
            )}
        </div>
    );
};

export default IntegrationsTab;
