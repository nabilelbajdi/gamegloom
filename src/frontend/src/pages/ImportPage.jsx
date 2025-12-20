// pages/ImportPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchIntegrationStatus } from '../api';
import { Loader2, ChevronRight, Settings } from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo';
import './ImportPage.css';

const ImportPage = () => {
    const [status, setStatus] = useState({ steam: null, psn: null });
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const data = await fetchIntegrationStatus();
                setStatus({
                    steam: data.steam || null,
                    psn: data.psn || null
                });
            } catch (error) {
                console.error('Failed to fetch integration status:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStatus();
    }, []);

    if (isLoading) {
        return (
            <div className="import-page">
                <div className="import-container">
                    <div className="import-loading">
                        <Loader2 className="animate-spin" size={28} />
                    </div>
                </div>
            </div>
        );
    }

    const hasSteam = !!status.steam;
    const hasPSN = !!status.psn;

    return (
        <div className="import-page">
            <div className="import-container">
                {/* Header */}
                <header className="import-header">
                    <h1 className="import-title">Import Games</h1>
                    <p className="import-subtitle">
                        Sync your gaming platforms to build your library
                    </p>
                </header>

                {/* Platform Cards */}
                <div className="import-platforms">
                    {/* Steam Card */}
                    <div
                        className={`platform-card steam ${hasSteam ? 'connected' : ''}`}
                        onClick={() => hasSteam ? navigate('/sync/steam') : navigate('/settings')}
                    >
                        <div className="platform-card-bg">
                            <img
                                src="/images/platforms/steam_banner.jpeg"
                                alt=""
                                className="platform-card-image"
                            />
                            <div className="platform-card-gradient steam" />
                        </div>

                        <div className="platform-card-content">
                            <div className="platform-card-top">
                                <BrandLogo brand="steam" size={32} />
                                <span className="platform-name">Steam</span>
                            </div>

                            <div className="platform-card-bottom">
                                {hasSteam ? (
                                    <>
                                        <div className="platform-user">
                                            <span className="platform-username">{status.steam.platform_username}</span>
                                            {status.steam.last_synced_at && (
                                                <span className="platform-synced">
                                                    Synced {new Date(status.steam.last_synced_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="platform-action">
                                            <span>Import</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="platform-connect">
                                        <Settings size={14} />
                                        <span>Connect in Settings</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PlayStation Card */}
                    <div
                        className={`platform-card psn ${hasPSN ? 'connected' : ''}`}
                        onClick={() => hasPSN ? navigate('/sync/psn') : navigate('/settings')}
                    >
                        <div className="platform-card-bg">
                            <img
                                src="/images/platforms/psn_banner.webp"
                                alt=""
                                className="platform-card-image"
                            />
                            <div className="platform-card-gradient psn" />
                        </div>

                        <div className="platform-card-content">
                            <div className="platform-card-top">
                                <BrandLogo brand="playstation" size={32} />
                                <span className="platform-name">PlayStation</span>
                            </div>

                            <div className="platform-card-bottom">
                                {hasPSN ? (
                                    <>
                                        <div className="platform-user">
                                            <span className="platform-username">{status.psn.platform_username}</span>
                                            {status.psn.last_synced_at && (
                                                <span className="platform-synced">
                                                    Synced {new Date(status.psn.last_synced_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="platform-action">
                                            <span>Import</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="platform-connect">
                                        <Settings size={14} />
                                        <span>Connect in Settings</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="import-coming-soon">
                    <span className="coming-soon-label">More platforms coming soon</span>
                    <div className="coming-soon-list">
                        <span className="coming-soon-item">Xbox</span>
                        <span className="coming-soon-divider">·</span>
                        <span className="coming-soon-item">Nintendo</span>
                        <span className="coming-soon-divider">·</span>
                        <span className="coming-soon-item">GOG</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportPage;
