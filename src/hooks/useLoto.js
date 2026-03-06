import { useState, useCallback, useEffect } from 'react';

export const useLoto = (initialMaxNumber = 90) => {
  const [maxNumber, setMaxNumber] = useState(initialMaxNumber);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastDrawn, setLastDrawn] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('loto_state');
    if (saved) {
      try {
        const { numbers, last } = JSON.parse(saved);
        setDrawnNumbers(numbers || []);
        setLastDrawn(last || null);
      } catch (e) {
        console.error("Error loading loto state", e);
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('loto_state', JSON.stringify({
      numbers: drawnNumbers,
      last: lastDrawn
    }));
  }, [drawnNumbers, lastDrawn]);

  const drawNumber = useCallback(() => {
    if (drawnNumbers.length >= maxNumber) {
      setIsFinished(true);
      return null;
    }

    let nextNumber;
    let attempts = 0;
    do {
      nextNumber = Math.floor(Math.random() * maxNumber) + 1;
      attempts++;
    } while (drawnNumbers.includes(nextNumber) && attempts < 1000);

    if (attempts >= 1000) return null;

    setDrawnNumbers(prev => [...prev, nextNumber]);
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
    if (window.confirm("Êtes-vous sûr de vouloir tout remettre à zéro ?")) {
      setDrawnNumbers([]);
      setLastDrawn(null);
      setIsFinished(false);
      localStorage.removeItem('loto_state');
    }
  }, []);

  const announceNumber = useCallback((number, voiceType = 'female') => {
    if (!number) return;

    // Trigger a silent utterance to unlock if needed
    if (!audioUnlocked) {
      const unlockUtterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlockUtterance);
      setAudioUnlocked(true);
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(number.toString());
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9; // Slightly slower for better clarity

    const voices = window.speechSynthesis.getVoices();
    const frVoices = voices.filter(v => v.lang.startsWith('fr'));

    if (frVoices.length > 0) {
      // Improved matching for iOS/macOS and common French voices
      let targetVoice;

      if (voiceType === 'female') {
        targetVoice = frVoices.find(v => /Amélie|Marie|Julie|Hortense|Renée|Sébastien/i.test(v.name) && !/male/i.test(v.name));
        // Fallback for female if not found
        if (!targetVoice) targetVoice = frVoices.find(v => /female|femme/i.test(v.name));
      } else {
        targetVoice = frVoices.find(v => /Thomas|Paul|Mathieu|Pierre|Jacques/i.test(v.name) || /male/i.test(v.name));
      }

      utterance.voice = targetVoice || frVoices[0];
    }

    window.speechSynthesis.speak(utterance);
  }, [audioUnlocked]);

  const unlockAudio = useCallback(() => {
    if (!audioUnlocked) {
      const utterance = new SpeechSynthesisUtterance("Prêt");
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      setAudioUnlocked(true);
    }
  }, [audioUnlocked]);

  // Ensure voices are loaded
  useEffect(() => {
    const handleVoices = () => window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = handleVoices;
    }
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

