import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoadingBar } from '../App';

export function useRouteLoadingBar() {
  const location = useLocation();
  const loadingBar = useLoadingBar();

  useEffect(() => {
    loadingBar.start();
    
    const frame = requestAnimationFrame(() => {
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