import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ChevronRight, Trash2, Camera, Edit3, Check, X } from 'lucide-react';
import { fetchIntegrationStatus, unlinkPlatform, clearAllGames, updateUserProfile } from '../api';
import { format } from 'date-fns';
import BrandLogo from '../components/common/BrandLogo';
import PSNConnectModal from '../components/settings/PSNConnectModal';
import SteamConnectModal from '../components/settings/SteamConnectModal';
import AvatarUpload from '../components/profile/AvatarUpload';
import useToastStore from '../store/useToastStore';
import useUserGameStore from '../store/useUserGameStore';
import { formatDistanceToNow } from 'date-fns';
import './SettingsPage.css';

const SettingsPage = () => {
    const { user, checkAuth } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToastStore();
    const { fetchCollection } = useUserGameStore();

    const [status, setStatus] = useState({ steam: null, psn: null });
    const [isLoading, setIsLoading] = useState(true);
    const [showPSNModal, setShowPSNModal] = useState(false);
    const [showSteamModal, setShowSteamModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [clearInput, setClearInput] = useState('');
    const callbackProcessed = useRef(false);

    // Profile state
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioInput, setBioInput] = useState('');
    const [showAvatarModal, setShowAvatarModal] = useState(false);

    const clearInputRef = useRef(null);


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

    useEffect(() => {
        if (isConfirming && clearInputRef.current) {
            setTimeout(() => clearInputRef.current?.focus(), 100);
        }
    }, [isConfirming]);

    const handleSteamCallback = async () => {
        if (callbackProcessed.current) return;

        const steamCallback = searchParams.get('steam_callback');
        const openidClaimedId = searchParams.get('openid.claimed_id');

        if (steamCallback && openidClaimedId) {
            callbackProcessed.current = true;
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
                setActionLoading('steam');
                await linkSteamAccount(openidParams);
                await loadStatus();
                toast.success('Steam account linked');
            } catch (error) {
                toast.error(`Failed to link Steam: ${error.message}`);
            } finally {
                setActionLoading(null);
            }
            setSearchParams({});
        }
    };


    const handleDisconnect = async (platform) => {
        const name = platform === 'psn' ? 'PlayStation' : 'Steam';
        if (!confirm(`Disconnect ${name}?`)) return;

        try {
            setActionLoading(platform);
            await unlinkPlatform(platform);
            await loadStatus();
            toast.success(`${name} disconnected`);
        } catch (error) {
            toast.error('Failed to disconnect');
        } finally {
            setActionLoading(null);
        }
    };

    const handleClearLibrary = async () => {
        if (clearInput !== 'DELETE') return;

        try {
            setActionLoading('clear');
            const result = await clearAllGames();
            toast.success(`Cleared ${result.count} games`);
            setIsConfirming(false);
            setClearInput('');
            fetchCollection();
        } catch (error) {
            toast.error('Failed to clear library');
        } finally {
            setActionLoading(null);
        }
    };

    const cancelClear = () => {
        setIsConfirming(false);
        setClearInput('');
    };

    // Profile handlers
    const handleAvatarUpdate = async (newAvatarUrl) => {
        // Avatar was updated via the AvatarUpload modal
        await checkAuth(); // Refresh user data
        toast.success('Avatar updated');
    };

    const startEditingBio = () => {
        setBioInput(user?.bio || '');
        setIsEditingBio(true);
    };

    const cancelBioEdit = () => {
        setIsEditingBio(false);
        setBioInput('');
    };

    const saveBio = async () => {
        try {
            setActionLoading('bio');
            await updateUserProfile({ bio: bioInput.trim() });
            await checkAuth(); // Refresh user data
            toast.success('Bio updated');
            setIsEditingBio(false);
        } catch (error) {
            toast.error('Failed to update bio');
        } finally {
            setActionLoading(null);
        }
    };

    // Helper to get user initials
    const getUserInitials = () => {
        if (!user?.username) return '?';
        return user.username.slice(0, 2).toUpperCase();
    };

    if (!user) {
        return (
            <div className="settings-page">
                <div className="settings-container">
                    <h1 className="settings-title">Settings</h1>
                </div>
            </div>
        );
    }

    const renderSkeleton = () => (
        <div className="settings-skeleton">
            {[1, 2].map(i => (
                <div key={i} className="settings-skeleton-row">
                    <div className="settings-skeleton-icon" />
                    <div className="settings-skeleton-text">
                        <div className="settings-skeleton-line" style={{ width: '120px' }} />
                        <div className="settings-skeleton-line" style={{ width: '80px' }} />
                    </div>
                    <div className="settings-skeleton-btn" />
                </div>
            ))}
        </div>
    );

    const renderIntegration = (platform, name, data) => {
        const isConnected = !!data;
        const username = data?.platform_username || data?.platform_user_id;
        const lastSynced = data?.last_synced_at;
        const loading = actionLoading === platform;

        return (
            <div className="integration-row">
                <div className="integration-icon">
                    <BrandLogo platform={platform} size={36} connected={isConnected} showStatus />
                </div>
                <div className="integration-content">
                    <h3 className={`integration-name ${!isConnected ? 'disconnected' : ''}`}>
                        {name}
                    </h3>
                    <p className="integration-meta">
                        {isConnected ? (
                            username || 'Connected'
                        ) : (
                            'Not connected'
                        )}
                        {isConnected && lastSynced && (
                            <> · Synced {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}</>
                        )}
                    </p>
                </div>
                <div className="integration-actions">
                    {isConnected ? (
                        <>
                            <button
                                onClick={() => navigate(`/sync/${platform}`, { state: { fromSettings: true } })}
                                className="integration-btn secondary"
                                disabled={loading}
                            >
                                Manage
                            </button>
                            <button
                                onClick={() => handleDisconnect(platform)}
                                className="integration-btn ghost"
                                disabled={loading}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Disconnect'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={platform === 'steam' ? () => setShowSteamModal(true) : () => setShowPSNModal(true)}
                            className="integration-btn primary"
                            disabled={loading}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="settings-page">
            <div className="settings-container">
                <header className="settings-header">
                    <h1 className="settings-title">Settings</h1>
                </header>

                {/* Profile */}
                <section className="settings-card">
                    <div className="settings-card-header">
                        <h2 className="settings-card-title">Profile</h2>
                    </div>
                    <div className="profile-section">
                        {/* Avatar */}
                        <div className="profile-avatar-wrapper">
                            <button
                                className="profile-avatar-btn"
                                onClick={() => setShowAvatarModal(true)}
                            >
                                {user.avatar && !user.avatar.includes('default-avatar') ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.username}
                                        className="profile-avatar"
                                    />
                                ) : (
                                    <div className="profile-avatar-placeholder">
                                        {getUserInitials()}
                                    </div>
                                )}
                                <div className="profile-avatar-overlay">
                                    <Camera size={20} />
                                </div>
                            </button>
                        </div>

                        {/* Info */}
                        <div className="profile-info">
                            <h3 className="profile-username">@{user.username}</h3>
                            <p className="profile-member-since">
                                Member since {format(new Date(user.created_at), 'MMMM yyyy')}
                            </p>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="profile-bio-wrapper">
                        <div className="profile-bio-header">
                            <span className="profile-bio-label">Bio</span>
                            {!isEditingBio && (
                                <button className="profile-bio-edit-btn" onClick={startEditingBio}>
                                    <Edit3 size={12} />
                                    <span>Edit</span>
                                </button>
                            )}
                        </div>
                        {isEditingBio ? (
                            <>
                                <textarea
                                    className="profile-bio-textarea"
                                    value={bioInput}
                                    onChange={(e) => setBioInput(e.target.value.slice(0, 160))}
                                    placeholder="Tell others about yourself..."
                                    rows={3}
                                    autoFocus
                                />
                                <div className="profile-bio-footer">
                                    <span className="profile-bio-counter">
                                        {bioInput.length}/160
                                    </span>
                                    <div className="profile-bio-actions">
                                        <button
                                            className="profile-bio-btn cancel"
                                            onClick={cancelBioEdit}
                                            disabled={actionLoading === 'bio'}
                                        >
                                            <X size={16} />
                                        </button>
                                        <button
                                            className="profile-bio-btn save"
                                            onClick={saveBio}
                                            disabled={actionLoading === 'bio'}
                                        >
                                            {actionLoading === 'bio' ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Check size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className={`profile-bio-text ${!user.bio ? 'empty' : ''}`}>
                                {user.bio || 'No bio yet. Click Edit to add one.'}
                            </p>
                        )}
                    </div>
                </section>

                {/* Platforms */}
                <section className="settings-card">
                    <div className="settings-card-header">
                        <h2 className="settings-card-title">Platforms</h2>
                    </div>
                    {isLoading ? renderSkeleton() : (
                        <>
                            {/* Connected */}
                            {(status.steam || status.psn) && (
                                <>
                                    <div className="settings-subheader">Connected</div>
                                    {status.steam && renderIntegration('steam', 'Steam', status.steam)}
                                    {status.psn && renderIntegration('psn', 'PlayStation', status.psn)}
                                </>
                            )}

                            {/* Not connected */}
                            {(!status.steam || !status.psn) && (
                                <>
                                    <div className="settings-subheader">Not connected</div>
                                    {!status.steam && renderIntegration('steam', 'Steam', null)}
                                    {!status.psn && renderIntegration('psn', 'PlayStation', null)}
                                </>
                            )}
                        </>
                    )}
                </section>

                {/* Data */}
                <section className="settings-card">
                    <div className="settings-card-header">
                        <h2 className="settings-card-title">Data</h2>
                    </div>

                    <div className={`clear-row-wrapper ${isConfirming ? 'confirming' : ''}`}>
                        <button
                            className="clear-row"
                            onClick={() => !isConfirming && setIsConfirming(true)}
                            disabled={isConfirming}
                        >
                            <div className="clear-row-icon">
                                <Trash2 size={18} />
                            </div>
                            <div className="clear-row-content">
                                <p className="clear-row-title">
                                    {isConfirming ? 'Type DELETE to confirm' : 'Clear library'}
                                </p>
                                <p className="clear-row-meta">
                                    {isConfirming ? 'This action cannot be undone' : 'Remove all games from your collection'}
                                </p>
                            </div>
                            <ChevronRight size={18} className="clear-row-chevron" />
                        </button>

                        {isConfirming && (
                            <div className="clear-confirm-panel">
                                <input
                                    ref={clearInputRef}
                                    type="text"
                                    value={clearInput}
                                    onChange={(e) => setClearInput(e.target.value.toUpperCase())}
                                    placeholder="Type DELETE"
                                    className="clear-confirm-input"
                                    onKeyDown={(e) => e.key === 'Enter' && handleClearLibrary()}
                                />
                                <div className="clear-confirm-actions">
                                    <button className="clear-confirm-btn cancel" onClick={cancelClear}>
                                        Cancel
                                    </button>
                                    <button
                                        className="clear-confirm-btn confirm"
                                        onClick={handleClearLibrary}
                                        disabled={clearInput !== 'DELETE' || actionLoading === 'clear'}
                                    >
                                        {actionLoading === 'clear' ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            'Clear'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {showPSNModal && (
                <PSNConnectModal
                    onClose={() => setShowPSNModal(false)}
                    onConnected={() => {
                        setShowPSNModal(false);
                        loadStatus();
                    }}
                />
            )}

            {showSteamModal && (
                <SteamConnectModal
                    onClose={() => setShowSteamModal(false)}
                    onConnected={() => {
                        setShowSteamModal(false);
                        loadStatus();
                    }}
                />
            )}

            {showAvatarModal && (
                <AvatarUpload
                    currentAvatar={user.avatar}
                    onAvatarUpdate={handleAvatarUpdate}
                    onClose={() => setShowAvatarModal(false)}
                />
            )}
        </div>
    );

};

export default SettingsPage;
