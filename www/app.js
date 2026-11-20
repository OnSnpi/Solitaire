window.SolitaireApp = window.SolitaireApp || {};

window.SolitaireApp.App = (async () => {
  const C = window.SolitaireApp.Config;
  const E = window.SolitaireApp.Engine;
  const state = E.state;
  const t = E.t;

  let selection = null;
  let hintHighlight = null;
  let autoCompleting = false;
  let lastCardInteractionTs = 0;

  function markCardInteraction() {
    lastCardInteractionTs = Date.now();
  }

  function setStatus(msg) {
    document.getElementById('status-bar').textContent = msg;
  }

  // ============================================================
  // TACTILE & ACOUSTIC ENGINE (Web Audio API + @capacitor/haptics)
  // ============================================================
  let audioCtx = null;
  let noiseBuffer = null;

  function ensureAudioContext() {
    if (!state.soundEnabled) return null;
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
        const sampleRate = audioCtx.sampleRate;
        const length = Math.floor(sampleRate * 0.14);
        noiseBuffer = audioCtx.createBuffer(1, length, sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.028));
        }
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  window.addEventListener('pointerdown', () => {
    ensureAudioContext();
  }, { passive: true });

  // Natural paper swish with organic pitch, envelope, and gain jitter to avoid "machine-gun" repetition
  function playPaperSwish(baseGain = 0.085, baseFreq = 1650, delay = 0) {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx || !noiseBuffer) return;
    try {
      const now = ctx.currentTime + delay;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;

      // Subtle playback rate variance (+/- 14%) shifts the grain texture organically
      src.playbackRate.setValueAtTime(0.86 + Math.random() * 0.28, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      // Frequency jitter (+/- 18%) so every card flip sounds slightly brighter or warmer
      const freqJitter = baseFreq * (0.82 + Math.random() * 0.36);
      filter.frequency.setValueAtTime(freqJitter, now);
      filter.frequency.exponentialRampToValueAtTime(freqJitter * (0.78 + Math.random() * 0.22), now + 0.06);
      filter.Q.value = 1.1 + Math.random() * 0.65;

      const gain = ctx.createGain();
      const peakGain = baseGain * (0.85 + Math.random() * 0.30);
      const attack = 0.006 + Math.random() * 0.008;
      const decay = 0.048 + Math.random() * 0.028;

      gain.gain.setValueAtTime(0.0008, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0004, now + attack + decay);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    } catch (e) {}
  }

  function playTone(freq, duration = 0.14, gainLevel = 0.08, type = 'sine', delay = 0) {
    if (!state.soundEnabled) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0008, start);
      gain.gain.linearRampToValueAtTime(gainLevel, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.01);
    } catch (e) {}
  }

  function getNativeHaptics() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        return window.Capacitor.Plugins.Haptics;
      }
    } catch (e) {}
    return null;
  }

  function triggerHaptic(kind) {
    if (!state.hapticsEnabled) return;
    const haptics = getNativeHaptics();

    if (haptics) {
      try {
        if (kind === 'tap' || kind === 'draw' || kind === 'recycle') {
          haptics.impact({ style: 'LIGHT' }).catch(() => {});
          return;
        }
        if (kind === 'move' || kind === 'undo') {
          haptics.impact({ style: 'MEDIUM' }).catch(() => {});
          return;
        }
        if (kind === 'foundation') {
          haptics.notification({ type: 'SUCCESS' }).catch(() => {});
          return;
        }
        if (kind === 'error') {
          haptics.notification({ type: 'ERROR' }).catch(() => {});
          return;
        }
        if (kind === 'win') {
          haptics.notification({ type: 'SUCCESS' }).catch(() => {});
          setTimeout(() => haptics.impact({ style: 'HEAVY' }).catch(() => {}), 140);
          return;
        }
      } catch (e) {}
    }

    if (navigator.vibrate) {
      try {
        if (kind === 'tap' || kind === 'draw') navigator.vibrate(10);
        else if (kind === 'recycle') navigator.vibrate([10, 25, 12]);
        else if (kind === 'move') navigator.vibrate(18);
        else if (kind === 'undo') navigator.vibrate([12, 25, 12]);
        else if (kind === 'foundation') navigator.vibrate([15, 35, 25]);
        else if (kind === 'error') navigator.vibrate([35, 25, 35]);
        else if (kind === 'win') navigator.vibrate([25, 45, 25, 45, 75]);
      } catch (e) {}
    }
  }

  function triggerFeedback(kind, extra = {}) {
    triggerHaptic(kind);
    if (!state.soundEnabled) return;

    if (kind === 'tap') {
      playTone(540, 0.075, 0.055, 'triangle', 0);
    } else if (kind === 'draw') {
      playPaperSwish(0.082, 1750, 0);
    } else if (kind === 'recycle') {
      // Richer double-deck shuffle swish when recycling the entire stock pile
      playPaperSwish(0.085, 1250, 0);
      playPaperSwish(0.075, 1550, 0.042);
    } else if (kind === 'move') {
      playPaperSwish(0.10, 1350, 0);
      playTone(420, 0.09, 0.042, 'sine', 0.015);
    } else if (kind === 'foundation') {
      const rank = extra.rank || 1;
      const semitones = Math.max(0, Math.min(12, rank - 1));
      const freq = 523.25 * Math.pow(2, semitones / 12);
      playTone(freq, 0.16, 0.08, 'sine', 0);
      playTone(freq * 1.5, 0.14, 0.04, 'triangle', 0.03);
    } else if (kind === 'undo') {
      playTone(587.33, 0.09, 0.055, 'sine', 0);
      playTone(440.00, 0.12, 0.055, 'sine', 0.055);
    } else if (kind === 'error') {
      playTone(174.61, 0.09, 0.06, 'triangle', 0);
      playTone(146.83, 0.12, 0.06, 'triangle', 0.06);
    } else if (kind === 'win') {
      const chord = [523.25, 659.25, 783.99, 987.77, 1046.50];
      chord.forEach((f, idx) => {
        playTone(f, 0.34, 0.085, 'sine', idx * 0.075);
      });
    }
  }

  // ============================================================
  // GAME FLOW & INTERACTION CONTROLLERS
  // ============================================================
  function dealNewGame(silent = false) {
    autoCompleting = false;
    selection = null;
    hintHighlight = null;
    E.setupNewDeal();
    renderAll();
    setStatus(t('newDealt'));
    if (!silent) triggerFeedback('recycle');
  }

  function restartCurrentDeal() {
    autoCompleting = false;
    selection = null;
    hintHighlight = null;
    E.restoreInitialDeal();
    renderAll();
    setStatus(t('restarted'));
    triggerFeedback('undo');
  }

  function undoMove() {
    if (autoCompleting) return;
    if (!E.popHistory()) return;
    selection = null;
    hintHighlight = null;
    renderAll();
    setStatus(t('undoneStatus'));
    triggerFeedback('undo');
  }

  function executeMove(source, index, cardIndex, target) {
    markCardInteraction();
    const res = E.applyMove(source, index, cardIndex, target);
    if (!res) return;

    if (res.type === 'foundation') {
      triggerFeedback('foundation', { rank: res.rank });
    } else {
      triggerFeedback('move');
    }

    selection = null;
    hintHighlight = null;
    renderAll();
    checkVictoryOrAutoComplete();
  }

  function drawFromStock() {
    if (state.isGameOver || autoCompleting) return;
    selection = null;
    hintHighlight = null;
    const wasEmptyStock = state.stock.length === 0 && state.waste.length > 0;
    if (E.drawStockCard()) {
      renderAll();
      setStatus(t('ready'));
      triggerFeedback(wasEmptyStock ? 'recycle' : 'draw');
      checkVictoryOrAutoComplete();
    }
  }

  function handleCardTap(source, index, cardIndex) {
    if (state.isGameOver || autoCompleting) return;
    markCardInteraction();
    hintHighlight = null;

    if (selection && selection.source === source && selection.index === index && selection.cardIndex === cardIndex) {
      selection = null;
      renderAll();
      setStatus(t('ready'));
      triggerFeedback('tap');
      return;
    }

    if (selection) {
      const matchingTarget = selection.targets.find(tg => {
        if (tg.type === 'tableau' && source === 'tableau' && tg.index === index) return true;
        if (tg.type === 'foundation' && source === 'foundation' && tg.index === index) return true;
        return false;
      });
      if (matchingTarget) {
        executeMove(selection.source, selection.index, selection.cardIndex, matchingTarget);
        setStatus(t('ready'));
        return;
      }
    }

    let leadCard = null;
    let isSingleTopCard = true;
    if (source === 'waste' && state.waste.length > 0) {
      leadCard = state.waste[state.waste.length - 1];
    } else if (source === 'foundation' && state.foundations[index].length > 0) {
      leadCard = state.foundations[index][state.foundations[index].length - 1];
    } else if (source === 'tableau' && state.tableau[index][cardIndex]) {
      leadCard = state.tableau[index][cardIndex];
      isSingleTopCard = (cardIndex === state.tableau[index].length - 1);
    }

    const targets = E.getValidTargets(source, index, cardIndex, false);
    if (targets.length === 0) {
      selection = null;
      renderAll();
      setStatus(t('noMoves'));
      triggerFeedback('error');
      return;
    }

    // Rule 1: Ace (A) and Two (2) always go straight to their foundation pile without asking
    if (leadCard && isSingleTopCard && (leadCard.rank === 1 || leadCard.rank === 2)) {
      const foundationTarget = targets.find(tg => tg.type === 'foundation');
      if (foundationTarget) {
        executeMove(source, index, cardIndex, foundationTarget);
        setStatus(t('ready'));
        return;
      }
    }

    // Rule 2: King (K) never asks which empty column to choose — picks the leftmost empty column automatically
    if (leadCard && leadCard.rank === 13) {
      const foundationTarget = targets.find(tg => tg.type === 'foundation');
      const emptyColTargets = targets
        .filter(tg => tg.type === 'tableau' && state.tableau[tg.index].length === 0)
        .sort((a, b) => a.index - b.index);

      if (!foundationTarget && emptyColTargets.length > 0) {
        executeMove(source, index, cardIndex, emptyColTargets[0]);
        setStatus(t('ready'));
        return;
      }
    }

    if (targets.length === 1) {
      executeMove(source, index, cardIndex, targets[0]);
      setStatus(t('ready'));
      return;
    }

    selection = { source, index, cardIndex, targets };
    renderAll();
    setStatus(t('multiTarget'));
    triggerFeedback('tap');
  }

  function checkVictoryOrAutoComplete() {
    const foundationTotal = state.foundations.reduce((acc, p) => acc + p.length, 0);
    if (foundationTotal === 52) {
      handleVictory();
      return;
    }
    if (!autoCompleting && E.canAutoComplete()) {
      runAutoComplete();
    }
  }

  function runAutoComplete() {
    if (autoCompleting) return;
    autoCompleting = true;
    selection = null;
    hintHighlight = null;
    setStatus(t('autoCompleting'));

    let stallCycles = 0;

    const step = () => {
      let moved = false;

      if (state.waste.length > 0) {
        const wTop = state.waste[state.waste.length - 1];
        for (let f = 0; f < 4; f++) {
          if (E.canAutoMoveToFoundation(wTop, f)) {
            state.waste.pop();
            if (state.foundations[f].length === 0) E.syncFoundationSuitSlot(f, wTop.suit);
            state.foundations[f].push(wTop);
            state.moves += 1;
            moved = true;
            stallCycles = 0;
            triggerFeedback('foundation', { rank: wTop.rank });
            break;
          }
        }
      }

      if (!moved) {
        let bestCol = -1;
        let bestF = -1;
        let lowestRank = 99;
        for (let c = 0; c < 7; c++) {
          const col = state.tableau[c];
          if (col.length === 0) continue;
          const topCard = col[col.length - 1];
          for (let f = 0; f < 4; f++) {
            if (E.canAutoMoveToFoundation(topCard, f) && topCard.rank < lowestRank) {
              lowestRank = topCard.rank;
              bestCol = c;
              bestF = f;
            }
          }
        }
        if (bestCol !== -1) {
          const card = state.tableau[bestCol].pop();
          if (state.foundations[bestF].length === 0) E.syncFoundationSuitSlot(bestF, card.suit);
          state.foundations[bestF].push(card);
          state.moves += 1;
          moved = true;
          stallCycles = 0;
          triggerFeedback('foundation', { rank: card.rank });
        }
      }

      if (!moved && (state.stock.length > 0 || state.waste.length > 0)) {
        if (state.stock.length > 0) {
          const card = state.stock.pop();
          card.faceUp = true;
          state.waste.push(card);
          state.moves += 1;
          moved = true;
          stallCycles += 1;
          playPaperSwish(0.045, 1800, 0);
        } else if (state.waste.length > 0) {
          while (state.waste.length > 0) {
            const c = state.waste.pop();
            c.faceUp = false;
            state.stock.push(c);
          }
          state.moves += 1;
          moved = true;
          stallCycles += 1;
        }
      }

      renderAll();
      const total = state.foundations.reduce((acc, p) => acc + p.length, 0);
      if (total === 52) {
        autoCompleting = false;
        handleVictory();
      } else if (moved && stallCycles <= 60) {
        setTimeout(step, 60);
      } else {
        autoCompleting = false;
        setStatus(t('ready'));
      }
    };
    setTimeout(step, 100);
  }

  function handleVictory() {
    selection = null;
    hintHighlight = null;
    const unlockedSomething = E.recordVictory();
    renderAll();
    triggerFeedback('win');

    document.getElementById('win-summary').textContent = t('winSummary', {
      moves: state.moves,
      wins: state.wins
    });

    const unlockMsgEl = document.getElementById('win-unlock-msg');
    if (unlockedSomething) {
      unlockMsgEl.innerHTML = t('winUnlockNewHtml');
      const settingsLink = document.getElementById('win-open-settings');
      if (settingsLink) {
        settingsLink.addEventListener('click', () => {
          closeModal('modal-win');
          openModal('modal-settings');
        });
      }
    } else {
      unlockMsgEl.innerHTML = '';
    }

    openModal('modal-win');
  }

  function showHint() {
    if (state.isGameOver || autoCompleting) return;
    selection = null;
    triggerFeedback('tap');

    const found = E.findHint();
    if (found) {
      hintHighlight = found.highlight;
      const targetLabel = found.target.type === 'foundation'
        ? t('targetFoundation')
        : t('targetColumn', { col: found.target.index + 1 });
      renderAll();
      setStatus(t('hintMove', {
        card: `${C.rankLabel(found.card.rank)} (${C.I18N[state.lang].suitNames[found.card.suit]})`,
        target: targetLabel
      }));
      return;
    }

    renderAll();
    if (state.stock.length > 0) {
      setStatus(t('hintStock'));
    } else if (state.waste.length > 0) {
      setStatus(t('hintRecycle'));
    } else {
      setStatus(t('noHints'));
    }
  }

  // ============================================================
  // BOARD RENDERING & DRAG-AND-DROP
  // ============================================================
  function createCardElement(card, source, index, cardIndex, topPx = 0) {
    const el = document.createElement('div');
    el.className = 'card ' + (card.faceUp ? 'face-up ' + (C.isRed(card.suit) ? 'red' : 'black') : 'face-down light-back');
    el.style.top = `${topPx}px`;
    el.style.zIndex = String(cardIndex + 2);
    el.dataset.source = source;
    el.dataset.index = String(index);
    el.dataset.cardIndex = String(cardIndex);

    if (!card.faceUp) {
      el.innerHTML = C.renderCardBackSVG(state.backTheme);
      el.addEventListener('pointerdown', () => markCardInteraction());
      return el;
    }

    const rText = C.rankLabel(card.rank);
    const sIcon = C.suitSVG(card.suit);

    if (state.faceTheme === 'watermark') {
      el.innerHTML = C.renderWatermarkCardSVG(card);
    } else if (state.faceTheme === 'solid4') {
      el.innerHTML = C.renderSolid4ColorCardSVG(card);
    } else if (state.faceTheme === 'canasta-lite') {
      el.innerHTML = C.renderCanastaLiteCardSVG(card);
    } else if (state.faceTheme === 'canasta') {
      el.innerHTML = C.renderCanastaCardSVG(card);
    } else {
      el.innerHTML = `
        <div class="card-top-strip">
          <span class="card-rank-sm">${rText}</span>
          <span class="card-suit-sm">${sIcon}</span>
        </div>
        <div class="card-center-hero">
          <span class="card-rank-xl">${rText}</span>
          <span class="card-suit-xl">${sIcon}</span>
        </div>
      `;
    }

    const isSelected = selection &&
      selection.source === source &&
      selection.index === index &&
      (source === 'tableau' ? cardIndex >= selection.cardIndex : true);

    if (isSelected) {
      el.classList.add('selected');
    }

    const isHinted = hintHighlight &&
      hintHighlight.source === source &&
      hintHighlight.index === index &&
      (source === 'tableau' ? cardIndex >= hintHighlight.cardIndex : true);

    if (isHinted) {
      el.classList.add('hint-glow');
    }

    attachCardInteraction(el, source, index, cardIndex);
    return el;
  }

  function setSourceCardsHidden(source, index, cardIndex, hidden) {
    if (source === 'tableau') {
      const colEl = document.querySelector(`.column[data-col="${index}"]`);
      if (!colEl) return;
      colEl.querySelectorAll('.card').forEach((cardEl) => {
        const idx = Number(cardEl.dataset.cardIndex);
        if (idx >= cardIndex) {
          cardEl.classList.toggle('dragging-hidden', hidden);
        }
      });
    } else if (source === 'waste') {
      const wasteCard = document.querySelector('#slot-waste .card');
      if (wasteCard) wasteCard.classList.toggle('dragging-hidden', hidden);
    } else if (source === 'foundation') {
      const fCard = document.querySelector(`#slot-f${index} .card`);
      if (fCard) fCard.classList.toggle('dragging-hidden', hidden);
    }
  }

  function attachCardInteraction(el, source, index, cardIndex) {
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let dragGhost = null;

    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      markCardInteraction();
      if (state.isGameOver || autoCompleting) return;
      if (e.button !== undefined && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      dragging = false;

      const onMove = (mv) => {
        const dx = mv.clientX - startX;
        const dy = mv.clientY - startY;
        if (!dragging && Math.hypot(dx, dy) > 8) {
          dragging = true;
          markCardInteraction();
          triggerFeedback('tap');
          const manualTargets = E.getValidTargets(source, index, cardIndex, true);
          selection = { source, index, cardIndex, targets: manualTargets };
          renderSignpostOverlaysOnly();

          setSourceCardsHidden(source, index, cardIndex, true);

          const rect = el.getBoundingClientRect();
          dragGhost = document.createElement('div');
          dragGhost.style.position = 'fixed';
          dragGhost.style.width = `${rect.width}px`;
          dragGhost.style.left = `${rect.left}px`;
          dragGhost.style.top = `${rect.top}px`;
          dragGhost.style.pointerEvents = 'none';
          dragGhost.style.opacity = '0.96';
          dragGhost.style.transform = 'scale(1.05)';

          if (source === 'tableau') {
            const slice = state.tableau[index].slice(cardIndex);
            slice.forEach((c, idx) => {
              const clone = createCardElement(c, 'ghost', 0, idx, idx * 24);
              dragGhost.appendChild(clone);
            });
          } else {
            const cardObj = source === 'waste'
              ? state.waste[state.waste.length - 1]
              : state.foundations[index][state.foundations[index].length - 1];
            dragGhost.appendChild(createCardElement(cardObj, 'ghost', 0, 0, 0));
          }
          document.getElementById('drag-layer').appendChild(dragGhost);
        }

        if (dragging && dragGhost) {
          const dx = mv.clientX - startX;
          const dy = mv.clientY - startY;
          dragGhost.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
        }
      };

      const onUp = (up) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        markCardInteraction();

        if (dragGhost) {
          dragGhost.remove();
          dragGhost = null;
        }

        if (!dragging) {
          handleCardTap(source, index, cardIndex);
          return;
        }

        setSourceCardsHidden(source, index, cardIndex, false);

        if (selection && selection.targets.length > 0) {
          const dropEl = document.elementFromPoint(up.clientX, up.clientY);
          if (dropEl) {
            const fSlot = dropEl.closest('.slot-foundation');
            if (fSlot) {
              const fIdx = Number(fSlot.id.replace('slot-f', ''));
              const match = selection.targets.find(tg => tg.type === 'foundation' && tg.index === fIdx);
              if (match) {
                executeMove(source, index, cardIndex, match);
                setStatus(t('ready'));
                return;
              }
            }
            const colEl = dropEl.closest('.column');
            if (colEl) {
              const cIdx = Number(colEl.dataset.col);
              const match = selection.targets.find(tg => tg.type === 'tableau' && tg.index === cIdx);
              if (match) {
                executeMove(source, index, cardIndex, match);
                setStatus(t('ready'));
                return;
              }
            }
          }
        }

        selection = null;
        renderAll();
        setStatus(t('ready'));
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  function addSignpostHighlight(container, targetObj) {
    const overlay = document.createElement('div');
    overlay.className = 'signpost-target';
    overlay.innerHTML = `<div class="signpost-dot"></div>`;
    overlay.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      markCardInteraction();
      if (!selection) return;
      executeMove(selection.source, selection.index, selection.cardIndex, targetObj);
      setStatus(t('ready'));
    });
    container.appendChild(overlay);
  }

  function renderSignpostOverlaysOnly() {
    document.querySelectorAll('.signpost-target').forEach(el => el.remove());
    if (!selection || selection.targets.length === 0) return;

    selection.targets.forEach(tg => {
      if (tg.type === 'foundation') {
        const fSlot = document.getElementById(`slot-f${tg.index}`);
        if (fSlot) addSignpostHighlight(fSlot, tg);
      } else if (tg.type === 'tableau') {
        const colEl = document.querySelector(`.column[data-col="${tg.index}"]`);
        if (!colEl) return;
        const cards = colEl.querySelectorAll('.card');
        if (cards.length > 0) {
          addSignpostHighlight(cards[cards.length - 1], tg);
        } else {
          const emptyBox = colEl.querySelector('.column-empty-target');
          if (emptyBox) addSignpostHighlight(emptyBox, tg);
        }
      }
    });
  }

  function applyThemeClasses() {
    document.body.classList.remove('royal-gold', 'face-tinted', 'face-watermark', 'face-solid4', 'face-canasta-lite', 'face-canasta');
    if (state.royalGold && state.wins >= C.ROYAL_GOLD_REQ) {
      document.body.classList.add('royal-gold');
      document.getElementById('meta-theme-color').setAttribute('content', '#0f172a');
    } else {
      document.getElementById('meta-theme-color').setAttribute('content', '#f0f2f5');
    }
    if (state.faceTheme && state.faceTheme !== 'classic') {
      document.body.classList.add(`face-${state.faceTheme}`);
    }
  }

  function renderAll() {
    applyThemeClasses();

    document.getElementById('lbl-wins').textContent = t('wins');
    document.getElementById('lbl-stock').textContent = t('stock');
    document.getElementById('lbl-undo').textContent = t('undo');
    document.getElementById('lbl-rules').textContent = t('rules');
    document.getElementById('lbl-hint').textContent = t('hint');
    document.getElementById('lbl-new').textContent = t('newGame');

    document.getElementById('val-wins').textContent = state.wins;
    document.getElementById('val-stock').textContent = state.stock.length;

    const undoBtn = document.getElementById('btn-undo');
    undoBtn.disabled = state.isGameOver || state.history.length === 0 || autoCompleting;

    // Render Stock
    const stockEl = document.getElementById('slot-stock');
    stockEl.innerHTML = '';
    if (state.stock.length > 0) {
      const backCard = createCardElement({ faceUp: false }, 'stock', 0, 0, 0);
      stockEl.appendChild(backCard);
    } else if (state.waste.length > 0) {
      stockEl.innerHTML = '<span class="stock-recycle">\u21bb</span>';
    }

    // Render Waste
    const wasteEl = document.getElementById('slot-waste');
    wasteEl.innerHTML = '';
    if (state.waste.length > 0) {
      const topWaste = state.waste[state.waste.length - 1];
      wasteEl.appendChild(createCardElement(topWaste, 'waste', 0, state.waste.length - 1, 0));
    }

    // Render Foundations
    for (let f = 0; f < 4; f++) {
      const fEl = document.getElementById(`slot-f${f}`);
      const slotSuit = state.foundationSuits[f] || C.DEFAULT_FOUNDATION_SUITS[f];
      fEl.innerHTML = `<div style="width:20px;height:20px;opacity:0.22;">${C.suitSVG(slotSuit)}</div>`;
      const pile = state.foundations[f];
      if (pile.length > 0) {
        const topF = pile[pile.length - 1];
        fEl.appendChild(createCardElement(topF, 'foundation', f, pile.length - 1, 0));
      }
    }

    // Render Tableau
    const tabRow = document.getElementById('tableau-row');
    const availHeight = tabRow.clientHeight || 380;
    tabRow.innerHTML = '';

    for (let c = 0; c < 7; c++) {
      const colEl = document.createElement('div');
      colEl.className = 'column';
      colEl.dataset.col = String(c);

      const colCards = state.tableau[c];
      if (colCards.length === 0) {
        const emptyBox = document.createElement('div');
        emptyBox.className = 'column-empty-target';
        emptyBox.textContent = 'K';
        colEl.appendChild(emptyBox);
      } else {
        const maxUsable = Math.max(180, availHeight - 88);
        const defaultFaceUpGap = 24;
        const defaultFaceDownGap = 10;
        let totalNeeded = 0;
        for (let i = 0; i < colCards.length - 1; i++) {
          totalNeeded += colCards[i].faceUp ? defaultFaceUpGap : defaultFaceDownGap;
        }
        const scale = totalNeeded > maxUsable ? (maxUsable / totalNeeded) : 1;

        let y = 0;
        colCards.forEach((card, idx) => {
          const cardEl = createCardElement(card, 'tableau', c, idx, Math.round(y));
          colEl.appendChild(cardEl);
          y += (card.faceUp ? defaultFaceUpGap : defaultFaceDownGap) * scale;
        });
      }
      tabRow.appendChild(colEl);
    }

    if (selection && selection.targets.length > 1) {
      renderSignpostOverlaysOnly();
    }
  }

  // ============================================================
  // MODALS & SETTINGS UI
  // ============================================================
  function renderSettingsModal() {
    document.getElementById('modal-settings-title').textContent = t('settingsTitle');
    document.getElementById('stat-lbl-moves').textContent = t('moves');
    document.getElementById('stat-val-moves').textContent = state.moves;
    document.getElementById('stat-lbl-cards').textContent = t('cardsCount');
    document.getElementById('stat-val-cards').textContent = '52';
    document.getElementById('stat-lbl-wins').textContent = t('wins');
    document.getElementById('stat-val-wins').textContent = state.wins;

    document.getElementById('lbl-lang-title').textContent = t('langTitle');
    document.getElementById('lbl-sound-title').textContent = t('soundTitle');
    document.getElementById('lbl-haptics-title').textContent = t('hapticsTitle');
    document.getElementById('lbl-faces-title').textContent = t('facesTitle');
    document.getElementById('lbl-backs-title').textContent = t('backsTitle');
    document.getElementById('lbl-royal-title').textContent = t('royalTitle');
    document.getElementById('settings-unlock-info').innerHTML = t('settingsUnlockInfo');
    document.getElementById('btn-restart-deal').textContent = t('restartBtn');
    document.getElementById('btn-close-settings').textContent = t('saveCloseBtn');

    document.getElementById('lang-cs').classList.toggle('active', state.lang === 'cs');
    document.getElementById('lang-en').classList.toggle('active', state.lang === 'en');

    const soundBtn = document.getElementById('btn-toggle-sound');
    soundBtn.classList.toggle('active', state.soundEnabled);
    soundBtn.innerHTML = state.soundEnabled
      ? `<span>&#128266;</span><span>${t('onLabel')}</span>`
      : `<span>&#128263;</span><span>${t('offLabel')}</span>`;

    const hapticsBtn = document.getElementById('btn-toggle-haptics');
    hapticsBtn.classList.toggle('active', state.hapticsEnabled);
    hapticsBtn.innerHTML = state.hapticsEnabled
      ? `<span>&#128243;</span><span>${t('onLabel')}</span>`
      : `<span>&#128244;</span><span>${t('offLabel')}</span>`;

    // Face themes
    const facesGrid = document.getElementById('face-themes-grid');
    facesGrid.innerHTML = '';
    C.FACE_THEMES.forEach(ft => {
      const unlocked = state.wins >= ft.req;
      const active = state.faceTheme === ft.id;
      const reqText = ft.req === 0
        ? t('unlockedFree')
        : (unlocked ? `\u2713 ${C.formatWinsLabel(ft.req, state.lang)}` : `\ud83d\udd12 ${C.formatWinsLabel(ft.req, state.lang)}`);
      const btn = document.createElement('button');
      btn.className = 'unlock-card' + (active ? ' active' : '') + (!unlocked ? ' locked' : '');
      btn.innerHTML = `
        ${active ? '<span class="unlock-check">\u2713</span>' : ''}
        <span class="unlock-name">${C.I18N[state.lang].faces[ft.id]}</span>
        <span class="unlock-req">${reqText}</span>
      `;
      if (unlocked) {
        btn.addEventListener('click', () => {
          state.faceTheme = ft.id;
          E.saveToStorage();
          renderSettingsModal();
          renderAll();
          triggerFeedback('tap');
        });
      }
      facesGrid.appendChild(btn);
    });

    // Back themes
    const backsGrid = document.getElementById('back-themes-grid');
    backsGrid.innerHTML = '';
    C.BACK_THEMES.forEach(bt => {
      const unlocked = state.wins >= bt.req;
      const active = state.backTheme === bt.id;
      const reqText = bt.req === 0
        ? t('unlockedFree')
        : (unlocked ? `\u2713 ${C.formatWinsLabel(bt.req, state.lang)}` : `\ud83d\udd12 ${C.formatWinsLabel(bt.req, state.lang)}`);
      const btn = document.createElement('button');
      btn.className = 'unlock-card' + (active ? ' active' : '') + (!unlocked ? ' locked' : '');
      btn.innerHTML = `
        ${active ? '<span class="unlock-check">\u2713</span>' : ''}
        <span class="unlock-name">${C.I18N[state.lang].backs[bt.id]}</span>
        <span class="unlock-req">${reqText}</span>
      `;
      if (unlocked) {
        btn.addEventListener('click', () => {
          state.backTheme = bt.id;
          E.saveToStorage();
          renderSettingsModal();
          renderAll();
          triggerFeedback('tap');
        });
      }
      backsGrid.appendChild(btn);
    });

    // Royal Gold Edition tile (52 wins)
    const royalUnlocked = state.wins >= C.ROYAL_GOLD_REQ;
    const royalBox = document.getElementById('royal-gold-box');
    royalBox.innerHTML = '';
    const rBtn = document.createElement('button');
    rBtn.className = 'unlock-card' + (state.royalGold ? ' active' : '') + (!royalUnlocked ? ' locked' : '');
    rBtn.innerHTML = `
      ${state.royalGold ? '<span class="unlock-check">\u2713</span>' : ''}
      <span class="unlock-name">\u265b ${t('royalName')}</span>
      <span class="unlock-req">${!royalUnlocked ? `\ud83d\udd12 ${C.formatWinsLabel(C.ROYAL_GOLD_REQ, state.lang)}` : (state.royalGold ? t('royalActive') : t('royalReady'))}</span>
    `;
    if (royalUnlocked) {
      rBtn.addEventListener('click', () => {
        state.royalGold = !state.royalGold;
        E.saveToStorage();
        renderSettingsModal();
        renderAll();
        triggerFeedback('tap');
      });
    }
    royalBox.appendChild(rBtn);
  }

  function openModal(id) {
    if (id === 'modal-settings') renderSettingsModal();
    if (id === 'modal-rules') {
      document.getElementById('modal-rules-title').textContent = t('rulesTitle');
      document.getElementById('rules-content').innerHTML = t('rulesHtml');
      document.getElementById('btn-close-rules').textContent = t('rulesUnderstandBtn');
    }
    if (id === 'modal-new') {
      document.getElementById('modal-new-title').textContent = t('newModalTitle');
      document.getElementById('opt-deal-new').textContent = t('optNewTitle');
      document.getElementById('opt-restart-same').textContent = t('optRestartTitle');
      document.getElementById('btn-close-new').textContent = t('cancelBtn');
    }
    if (id === 'modal-win') {
      document.getElementById('win-heading').textContent = t('winHeading');
      document.getElementById('btn-win-new').textContent = t('winNewBtn');
    }
    document.getElementById(id).classList.add('open');
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  // ============================================================
  // SECRET TESTING GESTURES & BOARD EVENT BINDINGS
  // ============================================================
  let titleTapCount = 0;
  let titleTapTimer = null;
  document.getElementById('modal-settings-title').addEventListener('click', () => {
    titleTapCount += 1;
    clearTimeout(titleTapTimer);
    if (titleTapCount >= 5) {
      titleTapCount = 0;
      const nextMilestone = C.ALL_MILESTONES.find(m => m > state.wins);
      const prevWins = state.wins;
      state.wins = nextMilestone !== undefined ? nextMilestone : (state.wins + 1);

      const newFace = C.FACE_THEMES.find(f => f.req > prevWins && f.req <= state.wins);
      if (newFace) state.faceTheme = newFace.id;

      const newBack = C.BACK_THEMES.find(b => b.req > prevWins && b.req <= state.wins);
      if (newBack) state.backTheme = newBack.id;

      if (prevWins < C.ROYAL_GOLD_REQ && state.wins >= C.ROYAL_GOLD_REQ) {
        state.royalGold = true;
      }

      E.saveToStorage();
      renderSettingsModal();
      renderAll();
      triggerFeedback('win');
      setStatus(t('winUnlockNewHtml').replace(/<[^>]*>/g, ''));
      return;
    }
    titleTapTimer = setTimeout(() => { titleTapCount = 0; }, 1500);
  });

  let winsTapCount = 0;
  let winsTapTimer = null;
  document.getElementById('stat-box-wins').addEventListener('click', () => {
    winsTapCount += 1;
    clearTimeout(winsTapTimer);
    if (winsTapCount >= 5) {
      winsTapCount = 0;
      state.wins = 0;
      state.royalGold = false;
      state.faceTheme = 'classic';
      state.backTheme = 'blue_diamond';
      E.saveToStorage();
      renderSettingsModal();
      renderAll();
      triggerFeedback('undo');
      setStatus(t('winsReset'));
      return;
    }
    winsTapTimer = setTimeout(() => { winsTapCount = 0; }, 1500);
  });

  // Board Touch Handling (Tap empty board to draw, Swipe right-to-left >= 50% width to undo)
  const boardEl = document.getElementById('board');
  const swipeBadgeEl = document.getElementById('swipe-undo-badge');
  let boardTouchStartX = 0;
  let boardTouchStartY = 0;
  let boardTracking = false;
  let boardSwiped = false;

  boardEl.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (Date.now() - lastCardInteractionTs < 350) return;
    if (e.target.closest('.card') || e.target.closest('.signpost-target') || e.target.closest('.slot-stock')) {
      return;
    }
    boardTouchStartX = e.clientX;
    boardTouchStartY = e.clientY;
    boardTracking = true;
    boardSwiped = false;
  });

  boardEl.addEventListener('pointermove', (e) => {
    if (!boardTracking) return;
    const dx = e.clientX - boardTouchStartX;
    const dy = e.clientY - boardTouchStartY;
    const minSwipeWidth = window.innerWidth * 0.5;
    const canUndo = !state.isGameOver && state.history.length > 0 && !autoCompleting;

    if (canUndo && dx <= -minSwipeWidth && Math.abs(dx) > Math.abs(dy) * 2) {
      if (!boardSwiped) {
        triggerHaptic('tap');
      }
      boardSwiped = true;
      swipeBadgeEl.classList.add('visible');
    } else {
      boardSwiped = false;
      swipeBadgeEl.classList.remove('visible');
    }
  });

  const resetBoardGesture = (e, isCancel = false) => {
    if (!boardTracking) return;
    boardTracking = false;
    swipeBadgeEl.classList.remove('visible');

    if (isCancel || Date.now() - lastCardInteractionTs < 350) {
      boardSwiped = false;
      return;
    }

    const dx = e.clientX - boardTouchStartX;
    const dy = e.clientY - boardTouchStartY;
    const minSwipeWidth = window.innerWidth * 0.5;

    if (boardSwiped || (dx <= -minSwipeWidth && Math.abs(dx) > Math.abs(dy) * 2)) {
      boardSwiped = false;
      undoMove();
      return;
    }

    if (Math.hypot(dx, dy) < 12) {
      drawFromStock();
    }
  };

  boardEl.addEventListener('pointerup', (e) => resetBoardGesture(e, false));
  boardEl.addEventListener('pointercancel', (e) => resetBoardGesture(e, true));

  // Controls & Modal Button Bindings
  document.getElementById('slot-stock').addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    markCardInteraction();
    drawFromStock();
  });
  document.getElementById('btn-undo').addEventListener('click', undoMove);
  document.getElementById('btn-hint').addEventListener('click', showHint);
  document.getElementById('btn-rules').addEventListener('click', () => {
    triggerFeedback('tap');
    openModal('modal-rules');
  });
  document.getElementById('btn-settings').addEventListener('click', () => {
    triggerFeedback('tap');
    openModal('modal-settings');
  });

  document.getElementById('btn-new').addEventListener('click', () => {
    if (state.isGameOver) {
      dealNewGame();
    } else {
      triggerFeedback('tap');
      openModal('modal-new');
    }
  });

  document.getElementById('btn-close-settings').addEventListener('click', () => {
    triggerFeedback('tap');
    closeModal('modal-settings');
  });
  document.getElementById('btn-close-rules').addEventListener('click', () => {
    triggerFeedback('tap');
    closeModal('modal-rules');
  });
  document.getElementById('btn-close-new').addEventListener('click', () => {
    triggerFeedback('tap');
    closeModal('modal-new');
  });

  document.getElementById('btn-restart-deal').addEventListener('click', () => {
    closeModal('modal-settings');
    restartCurrentDeal();
  });

  document.getElementById('opt-deal-new').addEventListener('click', () => {
    closeModal('modal-new');
    dealNewGame();
  });

  document.getElementById('opt-restart-same').addEventListener('click', () => {
    closeModal('modal-new');
    restartCurrentDeal();
  });

  document.getElementById('btn-win-new').addEventListener('click', () => {
    closeModal('modal-win');
    dealNewGame();
  });

  document.getElementById('lang-cs').addEventListener('click', () => {
    state.lang = 'cs';
    E.saveToStorage();
    renderSettingsModal();
    renderAll();
    setStatus(t('ready'));
    triggerFeedback('tap');
  });

  document.getElementById('lang-en').addEventListener('click', () => {
    state.lang = 'en';
    E.saveToStorage();
    renderSettingsModal();
    renderAll();
    setStatus(t('ready'));
    triggerFeedback('tap');
  });

  document.getElementById('btn-toggle-sound').addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    E.saveToStorage();
    renderSettingsModal();
    if (state.soundEnabled) {
      ensureAudioContext();
      triggerFeedback('foundation', { rank: 5 });
    }
  });

  document.getElementById('btn-toggle-haptics').addEventListener('click', () => {
    state.hapticsEnabled = !state.hapticsEnabled;
    E.saveToStorage();
    renderSettingsModal();
    if (state.hapticsEnabled) {
      triggerHaptic('foundation');
    }
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });

  window.addEventListener('resize', () => renderAll());

  // Async Boot: Reads native Android SharedPreferences first, falls back & migrates from localStorage
  const loaded = await E.loadFromStorage();
  if (!loaded) {
    dealNewGame(true);
  } else {
    renderAll();
    checkVictoryOrAutoComplete();
    setStatus(t('ready'));
  }

  return {
    dealNewGame,
    restartCurrentDeal,
    undoMove,
    renderAll
  };
})();
