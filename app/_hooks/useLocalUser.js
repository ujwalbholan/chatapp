import { useState, useEffect } from "react";

export const useLocalUser = (key) => {
  const [localUserId, setLocalUserId] = useState("");

  useEffect(() => {
    const getOrCreateLocalUserId = () => {
      let storedId = localStorage.getItem(key);
      if (!storedId) {
        storedId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(key, storedId);
      }
      setLocalUserId(storedId);
    };
    getOrCreateLocalUserId();
  }, [key]);

  return { localUserId };
};