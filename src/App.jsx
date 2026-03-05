import React, { useState, useEffect } from 'react';
import { useLoto } from './hooks/useLoto';
import './index.css';

const App = () => {
  const [mode, setMode] = useState('loto'); // 'loto' (90) or 'bingo' (60)
  const [voiceType, setVoiceType] = useState('female');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Custom states that the user can edit
  const [config, setConfig] = useState({
    drawNumber: 1,
    drawType: '1 Ligne',
    prize: 'Gros lot à gagner',
    clubLogo: '',
    partners: ['', ''],
    bgColor: '#0f172a',
    lastNumColor: '#f59e0b',
    gridDrawnColor: '#00d2ff',
    gridUndrawnColor: 'rgba(255, 255, 255, 0.05)',
    autoInterval: 5,
    drawPrep: [] // List of { number: 1, type: '1 Ligne', prize: '...' }
  });

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

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

  // Sync info card with drawPrep if available
  useEffect(() => {
    const currentDraw = config.drawPrep.find(d => parseInt(d.number) === drawnNumbers.length + 1);
    if (currentDraw) {
      setConfig(prev => ({
        ...prev,
        drawNumber: currentDraw.number,
        drawType: currentDraw.type,
        prize: currentDraw.prize
      }));
    }
  }, [drawnNumbers.length, config.drawPrep]);


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
    setIsAdminOpen(false);
  };

  return (
    <div className="app-container" style={{ '--dynamic-bg': config.bgColor }}>
      {/* Horizontal History / Recently Drawn */}
      <section className="history-section">
        {drawnNumbers.slice(-10).reverse().map((num, idx) => (
          <div key={`${num}-${idx}`} className={`history-ball ${idx === 0 ? 'highlight' : ''}`} style={idx === 0 ? { '--ball-color': config.lastNumColor } : {}}>
            {num}
          </div>
        ))}
      </section>

      {/* Grid Section */}
      <section className="grid-section">
        {Array.from({ length: maxNumbers }, (_, i) => i + 1).map(num => {
          const isDrawn = drawnNumbers.includes(num);
          const isLast = lastDrawn === num;
          return (
            <div
              key={num}
              className={`number-cell ${isDrawn ? 'drawn' : ''} ${isLast ? 'last-drawn' : ''}`}
              style={{
                backgroundColor: isDrawn ? (isLast ? config.lastNumColor : config.gridDrawnColor) : config.gridUndrawnColor,
                color: isDrawn ? 'white' : 'var(--text-muted)',
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
            <span className="info-value">{config.drawNumber}</span>
          </div>
          <div className="info-line">
            <span className="info-label">Type de tirage</span>
            <span className="info-value">{config.drawType}</span>
          </div>
          <div className="info-line">
            <span className="info-label">Lot à gagner</span>
            <span className="info-value">{config.prize}</span>
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
          <div className="logo-box">
            {config.clubLogo ? <img src={config.clubLogo} alt="Club" /> : <span className="logo-placeholder">LOGO CLUB</span>}
          </div>
          <div className="logo-box">
            <div style={{ display: 'flex', gap: '15px', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              {config.partners[0] ? <img src={config.partners[0]} alt="Partner 1" /> : <span className="logo-placeholder">PARTENAIRE 1</span>}
              {config.partners[1] ? <img src={config.partners[1]} alt="Partner 2" /> : config.partners[0] ? null : <span className="logo-placeholder">PARTENAIRE 2</span>}
            </div>
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
        <button className="btn" style={{ background: '#475569', color: 'white' }} onClick={() => { setIsAutoPlaying(false); reset(); }}>RAZ</button>
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
              </div>

              <h3>Couleurs Personnalisées</h3>
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
                  <label>Grille (Non Tiré)</label>
                  <input type="color" value={config.gridUndrawnColor} onChange={e => setConfig({ ...config, gridUndrawnColor: e.target.value })} />
                </div>
              </div>

              <div className="input-group">
                <label>Numéro en cours (manuel)</label>
                <input type="number" value={config.drawNumber} onChange={e => setConfig({ ...config, drawNumber: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Type de tirage (manuel)</label>
                <select value={config.drawType} onChange={e => setConfig({ ...config, drawType: e.target.value })}>
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
                <input type="text" value={config.prize} onChange={e => setConfig({ ...config, prize: e.target.value })} />
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
                          <input type="number" value={prep.number} onChange={e => {
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
              <h3>Logos</h3>
              <div className="input-group">
                <label>Logo du Club</label>
                <input type="file" accept="image/*" onChange={handleImageUpload('clubLogo')} />
              </div>
              <div className="input-group">
                <label>Partenaire 1</label>
                <input type="file" accept="image/*" onChange={handleImageUpload('partners', 0)} />
              </div>
              <div className="input-group">
                <label>Partenaire 2</label>
                <input type="file" accept="image/*" onChange={handleImageUpload('partners', 1)} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>FERMER</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
