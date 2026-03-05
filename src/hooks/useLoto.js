import { useState, useCallback, useEffect } from 'react';

export const useLoto = (initialMaxNumber = 90) => {
  const [maxNumber, setMaxNumber] = useState(initialMaxNumber);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastDrawn, setLastDrawn] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Update maxNumber when initialMaxNumber changes
  useEffect(() => {
    setMaxNumber(initialMaxNumber);
    reset();
  }, [initialMaxNumber]);


  const drawNumber = useCallback(() => {
    if (drawnNumbers.length >= maxNumber) {
      setIsFinished(true);
      return null;
    }

    let nextNumber;
    do {
      nextNumber = Math.floor(Math.random() * maxNumber) + 1;
    } while (drawnNumbers.includes(nextNumber));

    setDrawnNumbers(prev => {
      const newList = [...prev, nextNumber];
      return newList;
    });
    setLastDrawn(nextNumber);
    return nextNumber;
  }, [drawnNumbers, maxNumber]);

  const undoDraw = useCallback(() => {
    if (drawnNumbers.length === 0) return;

    setDrawnNumbers(prev => {
      const newList = [...prev];
      newList.pop();
      const newLast = newList.length > 0 ? newList[newList.length - 1] : null;
      setLastDrawn(newLast);
      return newList;
    });
    setIsFinished(false);
  }, [drawnNumbers]);


  const reset = useCallback(() => {
    setDrawnNumbers([]);
    setLastDrawn(null);
    setIsFinished(false);
  }, []);

  const announceNumber = useCallback((number, voiceType = 'female') => {
    if (!number) return;

    // Explicitly check for audio unlock (required for some browsers/devices like iPad)
    if (!audioUnlocked) {
      // Trigger a silent utterance to unlock
      const unlockUtterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlockUtterance);
      setAudioUnlocked(true);
    }

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
  }, [audioUnlocked]);

  const unlockAudio = useCallback(() => {
    if (!audioUnlocked) {
      const utterance = new SpeechSynthesisUtterance("Lancement");
      utterance.volume = 0; // Silent but triggers interaction
      window.speechSynthesis.speak(utterance);
      setAudioUnlocked(true);
    }
  }, [audioUnlocked]);

  // Ensure voices are loaded
  useEffect(() => {
    const handleVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = handleVoices;
    handleVoices();
  }, []);


  return {
    drawnNumbers,
    lastDrawn,
    isFinished,
    drawNumber,
    undoDraw,
    reset,
    announceNumber,
    unlockAudio
  };
};

