import React from 'react';

// Import SVG logos
import SteamLogo from '../../assets/logos/steam.svg';
import PlayStationLogo from '../../assets/logos/playstation.svg';

const logos = {
    steam: SteamLogo,
    psn: PlayStationLogo,
    playstation: PlayStationLogo,
};

/**
 * BrandLogo - Renders platform brand logos with proper styling
 * 
 * @param {string} platform - Platform identifier ('steam', 'psn', 'playstation')
 * @param {number} size - Size in pixels (default: 32)
 * @param {boolean} connected - Whether the platform is connected (affects opacity/grayscale)
 * @param {string} className - Additional CSS classes
 */
const BrandLogo = ({
    platform,
    size = 32,
    connected = true,
    className = ''
}) => {
    const logoSrc = logos[platform?.toLowerCase()];

    if (!logoSrc) {
        return null;
    }

    return (
        <img
            src={logoSrc}
            alt={`${platform} logo`}
            width={size}
            height={size}
            className={`
        transition-all duration-300
        ${connected ? 'opacity-100' : 'opacity-40 grayscale'}
        ${className}
      `}
            style={{
                filter: connected ? 'none' : 'grayscale(100%)',
            }}
        />
    );
};

export default BrandLogo;
