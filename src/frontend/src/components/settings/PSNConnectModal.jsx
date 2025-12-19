import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Check, CheckCircle } from 'lucide-react';
import { previewPSNProfile, linkPSNAccount } from '../../api';

// Trophy icons
import platinumIcon from '../../assets/icons/platinum-trophy.png';
import goldIcon from '../../assets/icons/gold-trophy.png';
import silverIcon from '../../assets/icons/silver-trophy.png';
import bronzeIcon from '../../assets/icons/bronze-trophy.png';

const PSNConnectModal = ({ onClose }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
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
        if (!username.trim() || username.length < 3) {
            setError('Enter a valid PSN username (3+ characters)');
            return;
        }

        try {
            setState('loading');
            setError(null);
            const data = await previewPSNProfile(username.trim());
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
            await linkPSNAccount(username.trim());
            setState('success');

            // After showing success, redirect with auto-sync flag
            setTimeout(() => {
                onClose();
                navigate('/sync/psn', { state: { triggerSync: true } });
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

    const totalTrophies = profile
        ? profile.platinum + profile.gold + profile.silver + profile.bronze
        : 0;

    return (
        <div className="psn-overlay" onClick={state !== 'success' ? onClose : undefined}>
            <div className="psn-modal" onClick={(e) => e.stopPropagation()}>

                {state !== 'success' && (
                    <button className="psn-close" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                )}

                {/* Header - same for all steps */}
                {state !== 'success' && (
                    <div className="psn-header">
                        <h2>PlayStation Import</h2>
                        <p>
                            Let's bring your PlayStation games into GameGloom. Just a heads up, your PSN profile and trophies need to be public for this to work.
                        </p>
                    </div>
                )}

                {/* State: Input */}
                {state === 'input' && (
                    <form onSubmit={handleLookup} className="psn-body">
                        <div className="psn-field">
                            <label htmlFor="psn-input">PSN Online ID</label>
                            <input
                                id="psn-input"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                autoFocus
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </div>

                        {error && <div className="psn-error">{error}</div>}

                        <div className="psn-actions">
                            <button type="button" onClick={onClose} className="psn-btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" disabled={!username.trim()} className="psn-btn-primary">
                                Continue
                            </button>
                        </div>
                    </form>
                )}

                {/* State: Loading */}
                {state === 'loading' && (
                    <div className="psn-body">
                        <div className="psn-profile-row">
                            <div className="psn-avatar-wrap">
                                <div className="psn-avatar psn-skeleton" />
                            </div>
                            <div className="psn-profile-main">
                                <div className="psn-skeleton psn-skeleton-line" style={{ width: '45%', height: 16 }} />
                                <div className="psn-skeleton psn-skeleton-line" style={{ width: '70%', height: 12 }} />
                                <div className="psn-skeleton psn-skeleton-line" style={{ width: '35%', height: 12 }} />
                            </div>
                        </div>
                        <div className="psn-loading-status">
                            <Loader2 size={14} className="spin" />
                            <span>Looking up profile…</span>
                        </div>
                    </div>
                )}

                {/* State: Found / Linking */}
                {(state === 'found' || state === 'linking') && profile && (
                    <div className="psn-body">
                        {/* Profile Section */}
                        <div className="psn-profile-row">
                            <div className="psn-avatar-wrap">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="psn-avatar" />
                                ) : (
                                    <div className="psn-avatar psn-avatar-fallback" />
                                )}
                            </div>

                            <div className="psn-profile-main">
                                <div className="psn-profile-top">
                                    <span className="psn-name">{profile.online_id}</span>
                                    {profile.trophy_level && (
                                        <span className="psn-level">Lv. {profile.trophy_level}</span>
                                    )}
                                </div>

                                {totalTrophies > 0 && (
                                    <div className="psn-trophy-row">
                                        <div className="psn-trophy">
                                            <img src={platinumIcon} alt="" />
                                            <span className="psn-trophy-platinum">{profile.platinum}</span>
                                        </div>
                                        <div className="psn-trophy">
                                            <img src={goldIcon} alt="" />
                                            <span className="psn-trophy-gold">{profile.gold}</span>
                                        </div>
                                        <div className="psn-trophy">
                                            <img src={silverIcon} alt="" />
                                            <span className="psn-trophy-silver">{profile.silver}</span>
                                        </div>
                                        <div className="psn-trophy">
                                            <img src={bronzeIcon} alt="" />
                                            <span className="psn-trophy-bronze">{profile.bronze}</span>
                                        </div>
                                    </div>
                                )}

                                <button className="psn-not-you" onClick={handleReset}>
                                    Not you? Try a different ID
                                </button>
                            </div>
                        </div>

                        {/* What gets imported */}
                        <div className="psn-import-box">
                            <div className="psn-import-item">
                                <Check size={14} />
                                <span>Played games</span>
                            </div>
                            <div className="psn-import-item">
                                <Check size={14} />
                                <span>Trophies</span>
                            </div>
                            <div className="psn-import-item">
                                <Check size={14} />
                                <span>Playtime</span>
                            </div>
                        </div>

                        {error && <div className="psn-error">{error}</div>}

                        {/* Actions */}
                        <div className="psn-actions">
                            <button onClick={onClose} disabled={state === 'linking'} className="psn-btn-secondary">
                                Cancel
                            </button>
                            <button onClick={handleConfirm} disabled={state === 'linking'} className="psn-btn-primary">
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
                    <div className="psn-body psn-success">
                        <div className="psn-success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h3>Account linked</h3>
                        <p>Redirecting to sync your library…</p>
                    </div>
                )}
            </div>

            <style>{`
                .psn-overlay {
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

                .psn-modal {
                    position: relative;
                    width: 100%;
                    max-width: 540px;
                    background: #0f0f0f;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5);
                    animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .psn-modal::before {
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

                .psn-close {
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

                .psn-close:hover {
                    color: #999;
                }

                .psn-header {
                    padding: 28px 28px 0;
                }

                .psn-header h2 {
                    margin: 0 0 8px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                }

                .psn-header p {
                    margin: 0;
                    font-size: 14px;
                    color: #666;
                    line-height: 1.5;
                }

                .psn-body {
                    padding: 24px 28px 28px;
                }

                /* Field */
                .psn-field {
                    margin-bottom: 20px;
                }

                .psn-field label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #888;
                }

                .psn-field input {
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

                .psn-field input::placeholder {
                    color: #444;
                }

                .psn-field input:focus {
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .psn-error {
                    margin-bottom: 16px;
                    padding: 10px 12px;
                    font-size: 13px;
                    color: #e57373;
                    background: rgba(229, 115, 115, 0.08);
                    border-radius: 6px;
                }

                /* Actions */
                .psn-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .psn-btn-primary {
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

                .psn-btn-primary:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .psn-btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .psn-btn-secondary {
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

                .psn-btn-secondary:hover:not(:disabled) {
                    color: #aaa;
                    border-color: rgba(255, 255, 255, 0.15);
                }

                .psn-btn-secondary:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                /* Profile Row */
                .psn-profile-row {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .psn-avatar-wrap {
                    flex-shrink: 0;
                }

                .psn-avatar {
                    width: 88px;
                    height: 88px;
                    border-radius: 10px;
                    object-fit: cover;
                }

                .psn-avatar-fallback {
                    background: rgba(255, 255, 255, 0.05);
                }

                .psn-profile-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 8px;
                }

                .psn-profile-top {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                }

                .psn-name {
                    font-size: 17px;
                    font-weight: 600;
                    color: #fff;
                }

                .psn-level {
                    font-size: 13px;
                    color: #666;
                }

                /* Trophy Row */
                .psn-trophy-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .psn-trophy {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .psn-trophy img {
                    width: 16px;
                    height: 16px;
                }

                .psn-trophy span {
                    font-size: 13px;
                    font-weight: 600;
                    font-variant-numeric: tabular-nums;
                    line-height: 1;
                    position: relative;
                    top: 2px;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* Trophy colors - gradient for metallic effect */
                .psn-trophy-platinum {
                    background: linear-gradient(180deg, #C3D0E6 0%, #98A8C7 55%, #7E8FAE 100%);
                }
                .psn-trophy-gold {
                    background: linear-gradient(180deg, #E2B76A 0%, #BE964D 55%, #9F7A3E 100%);
                }
                .psn-trophy-silver {
                    background: linear-gradient(180deg, #D8D8D8 0%, #ADADAD 55%, #8E8E8E 100%);
                }
                .psn-trophy-bronze {
                    background: linear-gradient(180deg, #D08A63 0%, #C1744B 55%, #A45F3E 100%);
                }

                .psn-not-you {
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

                .psn-not-you:hover {
                    opacity: 0.8;
                }

                /* Import Box */
                .psn-import-box {
                    display: flex;
                    gap: 16px;
                    padding: 14px 16px;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                }

                .psn-import-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #666;
                }

                .psn-import-item svg {
                    color: #4a4a4a;
                }

                /* Skeleton */
                .psn-skeleton {
                    background: rgba(255, 255, 255, 0.05);
                    animation: pulse 1.5s ease infinite;
                }

                .psn-skeleton-line {
                    border-radius: 4px;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .psn-loading-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #555;
                }

                /* Success State */
                .psn-success {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 40px 28px 48px;
                }

                .psn-success-icon {
                    color: #4ade80;
                    margin-bottom: 16px;
                }

                .psn-success h3 {
                    margin: 0 0 6px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                }

                .psn-success p {
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

export default PSNConnectModal;
