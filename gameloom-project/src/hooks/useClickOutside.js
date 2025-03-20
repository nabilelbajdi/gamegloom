import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside of the referenced element
 * 
 * @param {Function} onClickOutside - Callback function to run when a click outside is detected
 * @returns {React.RefObject} - Ref to attach to the element you want to detect clicks outside of
 */
const useClickOutside = (onClickOutside) => {
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClickOutside]);

  return ref;
};

export default useClickOutside; 