// Custom hook for managing status dropdown in game cards
import { useState, useRef } from "react";

export default function useStatusDropdown() {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const coverImageRef = useRef(null);
  
  const handleCoverMouseLeave = () => {
    if (showStatusDropdown) {
      setShowStatusDropdown(false);
    }
  };
  
  const handleStatusChange = (isOpen) => {
    setShowStatusDropdown(isOpen);
  };

  return {
    showStatusDropdown,
    coverImageRef,
    handleCoverMouseLeave,
    handleStatusChange
  };
} 