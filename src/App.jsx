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
    partners: ['', '']
  });

  const maxNumbers = mode === 'loto' ? 90 : 60;
  const { drawnNumbers, lastDrawn, drawNumber, reset, announceNumber } = useLoto(maxNumbers);

  const handleDraw = () => {
    const num = drawNumber();
    if (num) {
      announceNumber(num, voiceType);
    }
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
    <div className="app-container">
      {/* Grid Section */}
      <section className="grid-section">
        {Array.from({ length: maxNumbers }, (_, i) => i + 1).map(num => (
          <div
            key={num}
            className={`number-cell ${drawnNumbers.includes(num) ? 'drawn' : ''} ${lastDrawn === num ? 'last-drawn' : ''}`}
          >
            {num}
          </div>
        ))}
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
            <div className="ball" key={lastDrawn}>
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
        <button className="btn btn-primary" onClick={handleDraw}>TIRER UN NUMÉRO</button>
        <button className="btn" style={{ background: '#475569', color: 'white' }} onClick={reset}>RAZ</button>
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
                    <option value="bingo">Bingo (60)</option>
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

              <div className="input-group">
                <label>Numéro du tirage</label>
                <input type="number" value={config.drawNumber} onChange={e => setConfig({ ...config, drawNumber: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Type de tirage</label>
                <select value={config.drawType} onChange={e => setConfig({ ...config, drawType: e.target.value })}>
                  <option>1 Ligne</option>
                  <option>2 Lignes</option>
                  <option>Carton Plein</option>
                </select>
              </div>
              <div className="input-group">
                <label>Lot à gagner</label>
                <input type="text" value={config.prize} onChange={e => setConfig({ ...config, prize: e.target.value })} />
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
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>ENREGISTRER</button>
                <button type="button" className="btn" onClick={() => setIsAdminOpen(false)} style={{ flex: 1 }}>ANNULER</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
