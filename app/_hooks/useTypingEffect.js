import { useRef, useCallback } from "react";

export const useTypingEffect = (updateMessage) => {
  const typingIntervalsRef = useRef({});

  const startTypingEffect = useCallback((messageId, fullText) => {
    // Clear any existing typing interval for this message
    if (typingIntervalsRef.current[messageId]) {
      clearInterval(typingIntervalsRef.current[messageId]);
    }

    let currentIndex = 0;
    const typingSpeed = 50;

    typingIntervalsRef.current[messageId] = setInterval(() => {
      updateMessage(messageId, {
        displayText: fullText.substring(0, currentIndex + 1),
        isTypingEffect: true,
      });
      
      currentIndex++;

      if (currentIndex >= fullText.length) {
        clearInterval(typingIntervalsRef.current[messageId]);
        delete typingIntervalsRef.current[messageId];
        
        updateMessage(messageId, {
          text: fullText,
          displayText: fullText,
          isTypingEffect: false,
        });
      }
    }, typingSpeed);
  }, [updateMessage]);

  return { startTypingEffect };
};