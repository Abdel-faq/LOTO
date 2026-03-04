import { useState, useCallback, useEffect } from 'react';

export const useLoto = (maxNumber = 90) => {
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastDrawn, setLastDrawn] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const drawNumber = useCallback(() => {
    if (drawnNumbers.length >= maxNumber) {
      setIsFinished(true);
      return null;
    }

    let nextNumber;
    do {
      nextNumber = Math.floor(Math.random() * maxNumber) + 1;
    } while (drawnNumbers.includes(nextNumber));

    setDrawnNumbers(prev => [...prev, nextNumber]);
    setLastDrawn(nextNumber);
    return nextNumber;
  }, [drawnNumbers, maxNumber]);

  const reset = useCallback(() => {
    setDrawnNumbers([]);
    setLastDrawn(null);
    setIsFinished(false);
  }, []);

  const announceNumber = useCallback((number, voiceType = 'female') => {
    if (!number) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(number.toString());
    utterance.lang = 'fr-FR';
    
    // Try to find a specific voice if requested
    const voices = window.speechSynthesis.getVoices();
    const frVoices = voices.filter(v => v.lang.startsWith('fr'));
    
    if (frVoices.length > 0) {
      // Simple heuristic for male/female based on voice name
      const targetVoice = frVoices.find(v => 
        voiceType === 'female' ? /Hortense|Julie|Renée/i.test(v.name) : /Paul|Mathieu/i.test(v.name)
      ) || frVoices[0];
      
      utterance.voice = targetVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  // Ensure voices are loaded
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  return {
    drawnNumbers,
    lastDrawn,
    isFinished,
    drawNumber,
    reset,
    announceNumber
  };
};
