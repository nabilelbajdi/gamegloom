import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoadingBar } from '../App';

export function useRouteLoadingBar() {
  const location = useLocation();
  const loadingBar = useLoadingBar();

  useEffect(() => {
    loadingBar.start();
    
    // Wait for the next frame to ensure route change has started
    const frame = requestAnimationFrame(() => {
      // Wait for any images and fonts to load
      Promise.all([
        document.fonts.ready,
        new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve, { once: true });
          }
        })
      ]).then(() => {
        loadingBar.complete();
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [location.pathname]);
} 