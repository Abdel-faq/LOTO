import React, { useState, useEffect } from 'react';
import { useLoto } from './hooks/useLoto';
import './index.css';

const App = () => {
  // State avec chargement initial depuis localStorage
  const [config, setConfig] = useState(() => {
    const defaultConfig = {
      partners: [''],
      bgColor: '#0f172a',
      gridBgColor: 'rgba(30, 41, 59, 0.7)',
      lastNumColor: '#f59e0b',
      gridDrawnColor: '#00d2ff',
      gridUndrawnColor: 'rgba(30, 41, 59, 0.7)',
      gridUndrawnTextColor: 'rgba(255, 255, 255, 0.4)',
      autoInterval: 5,
      drawPrep: [],
      useManualInfo: false,
      currentPrepIdx: 0,
      manualNumber: '1',
      manualType: '1 Ligne',
      manualPrize: '',
      clubLogo: null,
      forceWhiteText: false,
      zoomLevel: 100
    };

    const saved = localStorage.getItem('loto_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultConfig, ...parsed };
      } catch (e) {
        console.error("Error loading config", e);
      }
    }
    return defaultConfig;
  });

  const [mode, setMode] = useState(() => localStorage.getItem('loto_mode') || 'loto');
  const [voiceType, setVoiceType] = useState(() => localStorage.getItem('loto_voice') || 'female');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Sauvegarde manuelle de la config

  useEffect(() => {
    localStorage.setItem('loto_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('loto_voice', voiceType);
  }, [voiceType]);

  // Appliquer la couleur de fond au body
  useEffect(() => {
    document.body.style.setProperty('--dynamic-bg', config.bgColor);
  }, [config.bgColor]);

  const maxNumbers = mode === 'loto' ? 90 : 75;
  const { drawnNumbers, lastDrawn, drawNumber, undoDraw, reset, announceNumber, unlockAudio } = useLoto(maxNumbers);

  // Auto Draw logic
  useEffect(() => {
    let timer;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        const num = drawNumber();
        if (num) {
          announceNumber(num, voiceType);
        } else {
          setIsAutoPlaying(false);
        }
      }, config.autoInterval * 1000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, drawNumber, announceNumber, voiceType, config.autoInterval]);

  // Identifie les infos à afficher (soit le tableau, soit le manuel)
  const getDisplayInfo = () => {
    if (config.useManualInfo) {
      return {
        number: config.manualNumber,
        type: config.manualType,
        prize: config.manualPrize
      };
    }
    
    const currentDraw = config.drawPrep[config.currentPrepIdx];
    if (currentDraw) {
      return {
        number: currentDraw.number,
        type: currentDraw.type,
        prize: currentDraw.prize
      };
    }
    
    return { number: '-', type: '-', prize: '-' };
  };

  const displayInfo = getDisplayInfo();

  const handleNextLot = () => {
    if (config.drawPrep.length === 0) {
      alert("Aucun lot n'est défini dans le tableau de préparation !");
      return;
    }

    const nextIdx = config.currentPrepIdx + 1;
    if (nextIdx < config.drawPrep.length) {
      setConfig(prev => ({
        ...prev,
        currentPrepIdx: nextIdx,
        useManualInfo: false
      }));
    } else {
      alert("Plus de lots dans le tableau de préparation !");
    }
  };

  const handlePrevLot = () => {
    if (config.drawPrep.length === 0) return;

    const prevIdx = config.currentPrepIdx - 1;
    if (prevIdx >= 0) {
      setConfig(prev => ({
        ...prev,
        currentPrepIdx: prevIdx,
        useManualInfo: false
      }));
    } else {
      alert("C'est déjà le premier lot !");
    }
  };

  const handleSurpriseLot = () => {
    setConfig(prev => ({
      ...prev,
      useManualInfo: true
    }));
  };


  const handleDraw = () => {
    unlockAudio();
    const num = drawNumber();
    if (num) {
      announceNumber(num, voiceType);
    }
  };

  const handleUndo = () => {
    undoDraw();
  };

  const toggleAuto = () => {
    unlockAudio();
    setIsAutoPlaying(!isAutoPlaying);
  };


  const handleImageUpload = (field, index = null) => (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (index === null) {
          setConfig({ ...config, [field]: reader.result });
        } else {
          const newPartners = [...config.partners];
          newPartners[index] = reader.result;
          setConfig({ ...config, partners: newPartners });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem('loto_config', JSON.stringify(config));
    alert("Configurations sauvegardées !");
    setIsAdminOpen(false);
  };

  const appStyle = {
    '--dynamic-bg': config.bgColor,
    zoom: `${config.zoomLevel || 100}%`
  };
  
  if (config.forceWhiteText) {
    appStyle['--text-main'] = 'white';
    appStyle['--text-muted'] = 'white';
    appStyle['--primary'] = 'white';
  }

  return (
    <div className="app-container" style={appStyle}>
      {/* Horizontal History / Recently Drawn */}
      <section className="history-section">
        {drawnNumbers.slice(-10).reverse().map((num, idx) => (
          <div key={`${num}-${idx}`} className={`history-ball ${idx === 0 ? 'highlight' : ''}`} style={idx === 0 ? { '--ball-color': config.lastNumColor } : {}}>
            {num}
          </div>
        ))}
      </section>

      <section className="grid-section" style={{ backgroundColor: config.gridBgColor }}>
        {Array.from({ length: maxNumbers }, (_, i) => i + 1).map(num => {
          const isDrawn = drawnNumbers.includes(num);
          return (
            <div
              key={num}
              className={`number-cell ${isDrawn ? 'drawn' : ''} ${isLast ? 'last-drawn' : ''}`}
                style={{
                  backgroundColor: isDrawn ? (isLast ? config.lastNumColor : config.gridDrawnColor) : (isLast ? 'transparent' : config.gridUndrawnColor),
                  color: isDrawn ? 'white' : (config.forceWhiteText ? 'white' : config.gridUndrawnTextColor),
                  borderColor: isLast ? config.lastNumColor : 'transparent'
                }}
              >
              {num}
            </div>
          );
        })}
      </section>


      {/* Display Section */}
      <section className="display-section">
        <div className="info-card">
          <div className="info-line">
            <span className="info-label">Tirage N°</span>
            <span className="info-value">{displayInfo.number}</span>
          </div>
          <div className="info-line">
            <span className="info-label">Type de tirage</span>
            <span className="info-value">{displayInfo.type}</span>
          </div>
          <div className="info-line">
            <span className="info-label">Lot à gagner</span>
            <span className="info-value">{displayInfo.prize}</span>
          </div>
        </div>

        <div className="drawn-number-large">
          {lastDrawn && (
            <div className="ball" key={lastDrawn} style={{ '--ball-color': config.lastNumColor }}>
              {lastDrawn}
            </div>
          )}
        </div>


        <div className="footer-logos">
          <div className="logo-box" style={{ width: '100%', height: '100%' }}>
            {config.clubLogo ? <img src={config.clubLogo} alt="Club" /> : <span className="logo-placeholder">LOGO CLUB</span>}
          </div>
        </div>
      </section>

      {/* Controls */}
      <div className="controls">
        <button className="btn btn-primary" onClick={handleDraw} disabled={isAutoPlaying}>TIRER UN NUMÉRO</button>
        <button className="btn" style={{ background: isAutoPlaying ? '#ef4444' : '#10b981', color: 'white' }} onClick={toggleAuto}>
          {isAutoPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button className="btn" style={{ background: '#6366f1', color: 'white' }} onClick={handleUndo}>RETOUR</button>
        <button className="btn" style={{ background: '#ec4899', color: 'white' }} onClick={handlePrevLot}>LOT PRÉCÉDENT</button>
        <button className="btn" style={{ background: '#ec4899', color: 'white' }} onClick={handleNextLot}>LOT SUIVANT</button>
        <button className="btn" style={{ background: '#8b5cf6', color: 'white' }} onClick={handleSurpriseLot}>LOT SURPRISE</button>
        <button className="btn" style={{ background: '#475569', color: 'white' }} onClick={() => { 
          setIsAutoPlaying(false); 
          reset(); 
          setConfig(prev => ({ 
            ...prev, 
            useManualInfo: false, 
            currentPrepIdx: (prev.drawPrep && prev.currentPrepIdx < prev.drawPrep.length - 1) ? prev.currentPrepIdx + 1 : prev.currentPrepIdx 
          })); 
        }}>RAZ</button>
      </div>


      <button className="admin-trigger" onClick={() => setIsAdminOpen(true)}>⚙</button>

      {/* Admin Modal */}
      {isAdminOpen && (
        <div className="admin-modal">
          <div className="admin-content">
            <h2>Configuration</h2>
            <form onSubmit={saveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Mode de jeu</label>
                  <select value={mode} onChange={(e) => { setMode(e.target.value); reset(); }}>
                    <option value="loto">Loto (90)</option>
                    <option value="bingo">Bingo (75)</option>
                  </select>

                </div>
                <div className="input-group">
                  <label>Voix</label>
                  <select value={voiceType} onChange={(e) => setVoiceType(e.target.value)}>
                    <option value="female">Femme</option>
                    <option value="male">Homme</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Intervalle Auto (sec: {config.autoInterval}s)</label>
                  <input
                    type="range"
                    min="5"
                    max="15"
                    value={config.autoInterval}
                    onChange={e => setConfig({ ...config, autoInterval: parseInt(e.target.value) })}
                  />
                </div>
                <div className="input-group">
                  <label>Zoom Projecteur ({config.zoomLevel || 100}%)</label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={config.zoomLevel || 100}
                    onChange={e => setConfig({ ...config, zoomLevel: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Couleurs Personnalisées</h3>
                <button 
                  type="button" 
                  className="btn" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: config.forceWhiteText ? '#10b981' : '#475569', color: 'white' }} 
                  onClick={() => setConfig({ ...config, forceWhiteText: !config.forceWhiteText })}
                >
                  {config.forceWhiteText ? 'Écritures Blanches : ACTIF' : 'Écritures Blanches : INACTIF'}
                </button>
              </div>
              <div className="color-group">
                <div className="input-group">
                  <label>Fond</label>
                  <input type="color" value={config.bgColor} onChange={e => setConfig({ ...config, bgColor: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Dernier Numéro</label>
                  <input type="color" value={config.lastNumColor} onChange={e => setConfig({ ...config, lastNumColor: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Grille (Tiré)</label>
                  <input type="color" value={config.gridDrawnColor} onChange={e => setConfig({ ...config, gridDrawnColor: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Grille (Fond)</label>
                  <input type="color" value={config.gridBgColor} onChange={e => setConfig({ ...config, gridBgColor: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Grille (Non Tiré)</label>
                  <input type="color" value={config.gridUndrawnColor} onChange={e => setConfig({ ...config, gridUndrawnColor: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Grille (Texte Non Tiré)</label>
                  <input type="color" value={config.gridUndrawnTextColor} onChange={e => setConfig({ ...config, gridUndrawnTextColor: e.target.value })} />
                </div>
              </div>

              <div className="input-group">
                <label>Numéro en cours (manuel)</label>
                <input type="text" value={config.manualNumber} onChange={e => setConfig({ ...config, manualNumber: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Type de tirage (manuel)</label>
                <select value={config.manualType} onChange={e => setConfig({ ...config, manualType: e.target.value })}>
                  <option>1 Ligne</option>
                  <option>2 Lignes</option>
                  <option>Carton Plein</option>
                  <option>Ligne du haut</option>
                  <option>Ligne du bas</option>
                  <option>Loto Chinois</option>
                </select>
              </div>
              <div className="input-group">
                <label>Lot à gagner (manuel)</label>
                <input type="text" value={config.manualPrize} onChange={e => setConfig({ ...config, manualPrize: e.target.value })} />
              </div>

              <hr />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Tableau de Préparation (1-50)</h3>
                <button type="button" className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => {
                  const newPrep = [...config.drawPrep, { number: config.drawPrep.length + 1, type: '1 Ligne', prize: '' }];
                  setConfig({ ...config, drawPrep: newPrep });
                }}>+ Ajouter un tirage</button>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '0.5rem' }}>
                <table className="prep-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>N°</th>
                      <th>Type</th>
                      <th>Lot</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.drawPrep.map((prep, idx) => (
                      <tr key={idx}>
                        <td>
                          <input type="text" value={prep.number} onChange={e => {
                            const newPrep = [...config.drawPrep];
                            newPrep[idx].number = e.target.value;
                            setConfig({ ...config, drawPrep: newPrep });
                          }} />
                        </td>
                        <td>
                          <select value={prep.type} onChange={e => {
                            const newPrep = [...config.drawPrep];
                            newPrep[idx].type = e.target.value;
                            setConfig({ ...config, drawPrep: newPrep });
                          }}>
                            <option>1 Ligne</option>
                            <option>2 Lignes</option>
                            <option>Carton Plein</option>
                            <option>Ligne du haut</option>
                            <option>Ligne du bas</option>
                            <option>Loto Chinois</option>
                          </select>
                        </td>
                        <td>
                          <input type="text" value={prep.prize} onChange={e => {
                            const newPrep = [...config.drawPrep];
                            newPrep[idx].prize = e.target.value;
                            setConfig({ ...config, drawPrep: newPrep });
                          }} />
                        </td>
                        <td>
                          <button type="button" onClick={() => {
                            const newPrep = config.drawPrep.filter((_, i) => i !== idx);
                            setConfig({ ...config, drawPrep: newPrep });
                          }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <hr />
              <div className="input-group">
                <label>Logo du Club</label>
                <input type="file" accept="image/*" onChange={handleImageUpload('clubLogo')} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>ENREGISTRER</button>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#4b5563', color: 'white' }} onClick={() => setIsAdminOpen(false)}>ANNULER</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
