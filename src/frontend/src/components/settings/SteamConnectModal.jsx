import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Check, CheckCircle } from 'lucide-react';
import { previewSteamProfile, linkSteamManual } from '../../api';

const SteamConnectModal = ({ onClose }) => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState(null);

    // States: 'input' | 'loading' | 'found' | 'linking' | 'success'
    const [state, setState] = useState('input');

    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!identifier.trim()) {
            setError('Enter a Steam ID, profile URL, or custom URL');
            return;
        }

        try {
            setState('loading');
            setError(null);
            const data = await previewSteamProfile(identifier.trim());
            setProfile(data);
            setState('found');
        } catch (err) {
            setError(err.message || 'Profile not found or is private');
            setState('input');
        }
    };

    const handleConfirm = async () => {
        try {
            setState('linking');
            setError(null);
            await linkSteamManual(identifier.trim());
            setState('success');

            // After showing success, redirect with auto-sync flag
            setTimeout(() => {
                onClose();
                navigate('/sync/steam', { state: { triggerSync: true } });
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to link account');
            setState('found');
        }
    };

    const handleReset = () => {
        setState('input');
        setProfile(null);
        setError(null);
    };

    return (
        <div className="steam-overlay" onClick={state !== 'success' ? onClose : undefined}>
            <div className="steam-modal" onClick={(e) => e.stopPropagation()}>

                {state !== 'success' && (
                    <button className="steam-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                )}

                {/* Header */}
                {state !== 'success' && (
                    <div className="steam-header">
                        <h2>Steam Import</h2>
                        <p>
                            Enter your Steam ID, profile URL, or custom URL to import your games. Your Steam profile must be public.
                        </p>
                    </div>
                )}

                {/* State: Input */}
                {state === 'input' && (
                    <form onSubmit={handleLookup} className="steam-body">
                        <div className="steam-field">
                            <label htmlFor="steam-input">Steam ID or Profile URL</label>
                            <input
                                id="steam-input"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="e.g. 76561198012345678 or steamcommunity.com/id/yourname"
                                autoFocus
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </div>

                        {error && <div className="steam-error">{error}</div>}

                        <div className="steam-actions">
                            <button type="button" onClick={onClose} className="steam-btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" disabled={!identifier.trim()} className="steam-btn-primary">
                                Continue
                            </button>
                        </div>
                    </form>
                )}

                {/* State: Loading */}
                {state === 'loading' && (
                    <div className="steam-body">
                        <div className="steam-profile-row">
                            <div className="steam-avatar-wrap">
                                <div className="steam-avatar steam-skeleton" />
                            </div>
                            <div className="steam-profile-main">
                                <div className="steam-skeleton steam-skeleton-line" style={{ width: '45%', height: 16 }} />
                                <div className="steam-skeleton steam-skeleton-line" style={{ width: '70%', height: 12 }} />
                                <div className="steam-skeleton steam-skeleton-line" style={{ width: '35%', height: 12 }} />
                            </div>
                        </div>
                        <div className="steam-loading-status">
                            <Loader2 size={14} className="spin" />
                            <span>Looking up profile…</span>
                        </div>
                    </div>
                )}

                {/* State: Found / Linking */}
                {(state === 'found' || state === 'linking') && profile && (
                    <div className="steam-body">
                        {/* Profile Section */}
                        <div className="steam-profile-row">
                            <div className="steam-avatar-wrap">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="steam-avatar" />
                                ) : (
                                    <div className="steam-avatar steam-avatar-fallback" />
                                )}
                            </div>

                            <div className="steam-profile-main">
                                <div className="steam-profile-top">
                                    <span className="steam-name">{profile.persona_name}</span>
                                </div>

                                {profile.game_count !== null && (
                                    <div className="steam-stats-row">
                                        <div className="steam-stat">
                                            <span>{profile.game_count} games</span>
                                        </div>
                                    </div>
                                )}

                                <button className="steam-not-you" onClick={handleReset}>
                                    Not you? Try a different ID
                                </button>
                            </div>
                        </div>

                        {/* What gets imported */}
                        <div className="steam-import-box">
                            <div className="steam-import-item">
                                <Check size={14} />
                                <span>Owned games</span>
                            </div>
                            <div className="steam-import-item">
                                <Check size={14} />
                                <span>Playtime</span>
                            </div>
                            <div className="steam-import-item">
                                <Check size={14} />
                                <span>Last played</span>
                            </div>
                        </div>

                        {error && <div className="steam-error">{error}</div>}

                        {/* Actions */}
                        <div className="steam-actions">
                            <button onClick={onClose} disabled={state === 'linking'} className="steam-btn-secondary">
                                Cancel
                            </button>
                            <button onClick={handleConfirm} disabled={state === 'linking'} className="steam-btn-primary">
                                {state === 'linking' ? (
                                    <>
                                        <Loader2 size={16} className="spin" />
                                        <span>Linking…</span>
                                    </>
                                ) : (
                                    <span>Link Account</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* State: Success */}
                {state === 'success' && (
                    <div className="steam-body steam-success">
                        <div className="steam-success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h3>Account linked</h3>
                        <p>Redirecting to sync your library…</p>
                    </div>
                )}
            </div>

            <style>{`
                .steam-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                    animation: fadeIn 0.15s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .steam-modal {
                    position: relative;
                    width: 100%;
                    max-width: 540px;
                    background: #0f0f0f;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5);
                    animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .steam-modal::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 24px;
                    right: 24px;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                }

                @keyframes modalIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .steam-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    padding: 8px;
                    color: #555;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: color 0.15s;
                    z-index: 10;
                }

                .steam-close:hover {
                    color: #999;
                }

                .steam-header {
                    padding: 28px 28px 0;
                }

                .steam-header h2 {
                    margin: 0 0 8px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                }

                .steam-header p {
                    margin: 0;
                    font-size: 14px;
                    color: #666;
                    line-height: 1.5;
                }

                .steam-body {
                    padding: 24px 28px 28px;
                }

                /* Field */
                .steam-field {
                    margin-bottom: 20px;
                }

                .steam-field label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #888;
                }

                .steam-field input {
                    width: 100%;
                    padding: 12px 14px;
                    font-size: 14px;
                    color: #fff;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    outline: none;
                    transition: border-color 0.15s;
                }

                .steam-field input::placeholder {
                    color: #444;
                }

                .steam-field input:focus {
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .steam-error {
                    margin-bottom: 16px;
                    padding: 10px 12px;
                    font-size: 13px;
                    color: #e57373;
                    background: rgba(229, 115, 115, 0.08);
                    border-radius: 6px;
                }

                /* Actions */
                .steam-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .steam-btn-primary {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 20px;
                    font-size: 14px;
                    font-weight: 600;
                    color: #000;
                    background: var(--color-primary, #e5b978);
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: opacity 0.15s, transform 0.15s;
                }

                .steam-btn-primary:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .steam-btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .steam-btn-secondary {
                    flex: 1;
                    padding: 12px 20px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #777;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: color 0.15s, border-color 0.15s;
                }

                .steam-btn-secondary:hover:not(:disabled) {
                    color: #aaa;
                    border-color: rgba(255, 255, 255, 0.15);
                }

                .steam-btn-secondary:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                /* Profile Row */
                .steam-profile-row {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .steam-avatar-wrap {
                    flex-shrink: 0;
                }

                .steam-avatar {
                    width: 88px;
                    height: 88px;
                    border-radius: 10px;
                    object-fit: cover;
                }

                .steam-avatar-fallback {
                    background: rgba(255, 255, 255, 0.05);
                }

                .steam-profile-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 8px;
                }

                .steam-profile-top {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                }

                .steam-name {
                    font-size: 17px;
                    font-weight: 600;
                    color: #fff;
                }

                /* Stats Row */
                .steam-stats-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .steam-stat {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #888;
                }

                .steam-stat svg {
                    color: #666;
                }

                .steam-not-you {
                    padding: 0;
                    font-size: 12px;
                    color: var(--color-primary, #e5b978);
                    background: none;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    text-decoration: underline;
                    text-underline-offset: 2px;
                    transition: opacity 0.15s;
                }

                .steam-not-you:hover {
                    opacity: 0.8;
                }

                /* Import Box */
                .steam-import-box {
                    display: flex;
                    gap: 16px;
                    padding: 14px 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }

                .steam-import-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #666;
                }

                .steam-import-item svg {
                    color: #4a4a4a;
                }

                /* Skeleton */
                .steam-skeleton {
                    background: rgba(255, 255, 255, 0.05);
                    animation: pulse 1.5s ease infinite;
                }

                .steam-skeleton-line {
                    border-radius: 4px;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .steam-loading-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #555;
                }

                /* Success State */
                .steam-success {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 40px 28px 48px;
                }

                .steam-success-icon {
                    color: #4ade80;
                    margin-bottom: 16px;
                }

                .steam-success h3 {
                    margin: 0 0 6px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                }

                .steam-success p {
                    margin: 0;
                    font-size: 14px;
                    color: #666;
                }

                /* Spinner */
                .spin {
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SteamConnectModal;
