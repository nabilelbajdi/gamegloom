import React from 'react';
import { Check } from 'lucide-react';

// Import SVG logos
import SteamLogo from '../../assets/logos/steam_logo.svg';
import PlayStationLogo from '../../assets/logos/psn_logo.svg';

const logos = {
    steam: SteamLogo,
    psn: PlayStationLogo,
    playstation: PlayStationLogo,
};

/**
 * BrandLogo - Platform logo with optional connected indicator.
 */
const BrandLogo = ({
    platform,
    size = 32,
    connected = false,
    showStatus = false,
    className = ''
}) => {
    const logoSrc = logos[platform?.toLowerCase()];

    if (!logoSrc) {
        return null;
    }

    return (
        <div className={`brand-logo ${className}`} style={{ position: 'relative', width: size, height: size }}>
            <img
                src={logoSrc}
                alt={`${platform} logo`}
                width={size}
                height={size}
                style={{ display: 'block' }}
            />
            {showStatus && connected && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 14,
                        height: 14,
                        background: '#1ed760',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #1a1a1a',
                    }}
                >
                    <Check size={8} color="black" strokeWidth={3} />
                </div>
            )}
        </div>
    );
};

export default BrandLogo;
