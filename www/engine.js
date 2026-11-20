window.SolitaireApp = window.SolitaireApp || {};

window.SolitaireApp.Engine = (() => {
  const C = window.SolitaireApp.Config;

  function detectLang() {
    const nav = (navigator.language || 'en').toLowerCase();
    return (nav.startsWith('cs') || nav.startsWith('sk')) ? 'cs' : 'en';
  }

  const state = {
    lang: detectLang(),
    wins: 0,
    faceTheme: 'classic',
    backTheme: 'blue_diamond',
    royalGold: false,
    soundEnabled: true,
    hapticsEnabled: true,
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    foundationSuits: [...C.DEFAULT_FOUNDATION_SUITS],
    tableau: [[], [], [], [], [], [], []],
    initialDeal: null,
    history: [],
    moves: 0,
    isGameOver: false,
    seedCursor: -1,
    seedStep: 0,
    seedUsedCount: 0,
    currentSeed: null
  };

  function t(key, vars = {}) {
    let str = (C.I18N[state.lang] && C.I18N[state.lang][key]) || key;
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
    return str;
  }

  function cloneBoardState() {
    return JSON.parse(JSON.stringify({
      stock: state.stock,
      waste: state.waste,
      foundations: state.foundations,
      foundationSuits: state.foundationSuits,
      tableau: state.tableau,
      moves: state.moves
    }));
  }

  // Dual Storage Engine: Primary Native Android SharedPreferences (@capacitor/preferences) + Backup localStorage
  function getNativePreferences() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        return window.Capacitor.Plugins.Preferences;
      }
    } catch (e) {}
    return null;
  }

  function storageWrite(payloadObj) {
    const serialized = JSON.stringify(payloadObj);
    try {
      localStorage.setItem(C.STORAGE_KEY, serialized);
    } catch (e) {}

    const prefs = getNativePreferences();
    if (prefs) {
      prefs.set({ key: C.STORAGE_KEY, value: serialized }).catch(() => {});
    }
  }

  async function storageRead() {
    const prefs = getNativePreferences();
    if (prefs) {
      try {
        const res = await prefs.get({ key: C.STORAGE_KEY });
        if (res && res.value) {
          try { localStorage.setItem(C.STORAGE_KEY, res.value); } catch (e) {}
          return JSON.parse(res.value);
        }
      } catch (e) {}
    }

    try {
      let raw = localStorage.getItem(C.STORAGE_KEY);
      if (!raw) {
        for (const oldKey of C.LEGACY_KEYS) {
          const legacyRaw = localStorage.getItem(oldKey);
          if (legacyRaw) {
            raw = legacyRaw;
            break;
          }
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && prefs) {
          prefs.set({ key: C.STORAGE_KEY, value: raw }).catch(() => {});
        }
        return parsed;
      }
    } catch (e) {}
    return null;
  }

  function saveToStorage() {
    storageWrite({
      lang: state.lang,
      wins: state.wins,
      faceTheme: state.faceTheme,
      backTheme: state.backTheme,
      royalGold: state.royalGold,
      soundEnabled: state.soundEnabled,
      hapticsEnabled: state.hapticsEnabled,
      stock: state.stock,
      waste: state.waste,
      foundations: state.foundations,
      foundationSuits: state.foundationSuits,
      tableau: state.tableau,
      initialDeal: state.initialDeal,
      history: state.history,
      moves: state.moves,
      isGameOver: state.isGameOver,
      seedCursor: state.seedCursor,
      seedStep: state.seedStep,
      seedUsedCount: state.seedUsedCount,
      currentSeed: state.currentSeed
    });
  }

  async function loadFromStorage() {
    try {
      const saved = await storageRead();
      if (!saved || !Array.isArray(saved.tableau)) return false;
      Object.assign(state, saved);
      if (!Array.isArray(state.foundationSuits) || state.foundationSuits.length !== 4) {
        state.foundationSuits = [...C.DEFAULT_FOUNDATION_SUITS];
      }
      if (!C.BACK_THEMES.some(b => b.id === state.backTheme)) {
        state.backTheme = 'blue_diamond';
      }
      if (!C.FACE_THEMES.some(f => f.id === state.faceTheme)) {
        state.faceTheme = 'classic';
      }
      if (typeof state.soundEnabled !== 'boolean') state.soundEnabled = true;
      if (typeof state.hapticsEnabled !== 'boolean') state.hapticsEnabled = true;
      if (typeof state.seedCursor !== 'number') state.seedCursor = -1;
      if (typeof state.seedStep !== 'number') state.seedStep = 0;
      if (typeof state.seedUsedCount !== 'number') state.seedUsedCount = 0;
      if (state.isGameOver) {
        state.history = [];
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Deterministic PRNG (Mulberry32) - identical to winnable-seeds solver
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const tmp = y;
      y = x % y;
      x = tmp;
    }
    return x;
  }

  // Picks the next unused verified winnable seed using a coprime full-cycle permutation
  function getNextWinnableSeed() {
    const seeds = window.WINNABLE_SEEDS;
    if (!Array.isArray(seeds) || seeds.length === 0) return null;
    const n = seeds.length;

    if (
      state.seedCursor < 0 ||
      state.seedCursor >= n ||
      state.seedStep <= 0 ||
      state.seedStep >= n ||
      gcd(state.seedStep, n) !== 1 ||
      state.seedUsedCount >= n
    ) {
      state.seedCursor = Math.floor(Math.random() * n);
      let step = Math.floor(Math.random() * (n - 2)) + 1;
      while (gcd(step, n) !== 1) {
        step = (step + 1) % n;
        if (step === 0) step = 1;
      }
      state.seedStep = step;
      state.seedUsedCount = 0;
    }

    const chosenSeed = seeds[state.seedCursor];
    state.seedCursor = (state.seedCursor + state.seedStep) % n;
    state.seedUsedCount += 1;
    state.currentSeed = chosenSeed;
    return chosenSeed;
  }

  function createDeckFromSeed(seed) {
    const rand = mulberry32(seed);
    const deck = [];
    let id = 1;
    for (const suit of C.ALL_SUITS) {
      for (const rank of C.RANKS) {
        deck.push({ id: id++, suit, rank, faceUp: false });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function createRandomDeckFallback() {
    const deck = [];
    let id = 1;
    for (const suit of C.ALL_SUITS) {
      for (const rank of C.RANKS) {
        deck.push({ id: id++, suit, rank, faceUp: false });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function setupNewDeal() {
    const seed = getNextWinnableSeed();
    const deck = seed !== null ? createDeckFromSeed(seed) : createRandomDeckFallback();
    const tableau = [[], [], [], [], [], [], []];
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop();
        card.faceUp = (row === col);
        tableau[col].push(card);
      }
    }
    state.stock = deck;
    state.waste = [];
    state.foundations = [[], [], [], []];
    state.foundationSuits = [...C.DEFAULT_FOUNDATION_SUITS];
    state.tableau = tableau;
    state.moves = 0;
    state.history = [];
    state.isGameOver = false;
    state.initialDeal = JSON.parse(JSON.stringify({
      stock: state.stock,
      waste: [],
      foundations: [[], [], [], []],
      foundationSuits: [...C.DEFAULT_FOUNDATION_SUITS],
      tableau: state.tableau
    }));
    saveToStorage();
  }

  function restoreInitialDeal() {
    if (!state.initialDeal) {
      setupNewDeal();
      return;
    }
    const copy = JSON.parse(JSON.stringify(state.initialDeal));
    state.stock = copy.stock;
    state.waste = copy.waste;
    state.foundations = copy.foundations;
    state.foundationSuits = copy.foundationSuits || [...C.DEFAULT_FOUNDATION_SUITS];
    state.tableau = copy.tableau;
    state.moves = 0;
    state.history = [];
    state.isGameOver = false;
    saveToStorage();
  }

  function pushHistory() {
    if (state.isGameOver) return;
    state.history.push(cloneBoardState());
    if (state.history.length > 60) state.history.shift();
  }

  function popHistory() {
    if (state.isGameOver || state.history.length === 0) return false;
    const prev = state.history.pop();
    state.stock = prev.stock;
    state.waste = prev.waste;
    state.foundations = prev.foundations;
    state.foundationSuits = prev.foundationSuits || [...C.DEFAULT_FOUNDATION_SUITS];
    state.tableau = prev.tableau;
    state.moves = prev.moves;
    saveToStorage();
    return true;
  }

  function isSuitClaimedElsewhere(suit, excludeIdx) {
    for (let i = 0; i < 4; i++) {
      if (i !== excludeIdx && state.foundations[i].length > 0 && state.foundations[i][0].suit === suit) {
        return true;
      }
    }
    return false;
  }

  function canDropManualToFoundation(card, fIdx) {
    const pile = state.foundations[fIdx];
    if (pile.length === 0) {
      return card.rank === 1 && !isSuitClaimedElsewhere(card.suit, fIdx);
    }
    const top = pile[pile.length - 1];
    return top.suit === card.suit && card.rank === top.rank + 1;
  }

  function canAutoMoveToFoundation(card, fIdx) {
    const pile = state.foundations[fIdx];
    if (pile.length === 0) {
      if (card.rank !== 1 || isSuitClaimedElsewhere(card.suit, fIdx)) return false;
      if (state.foundationSuits[fIdx] === card.suit) return true;
      const designatedIdx = state.foundationSuits.indexOf(card.suit);
      return designatedIdx !== -1 && state.foundations[designatedIdx].length > 0;
    }
    const top = pile[pile.length - 1];
    return top.suit === card.suit && card.rank === top.rank + 1;
  }

  function canMoveToTableau(card, colIdx) {
    const col = state.tableau[colIdx];
    if (col.length === 0) {
      return card.rank === 13;
    }
    const top = col[col.length - 1];
    if (!top.faceUp) return false;
    return C.isRed(top.suit) !== C.isRed(card.suit) && card.rank === top.rank - 1;
  }

  function getValidTargets(source, index, cardIndex, isManualDrag = false) {
    let cards = [];
    if (source === 'waste') {
      if (state.waste.length === 0) return [];
      cards = [state.waste[state.waste.length - 1]];
    } else if (source === 'foundation') {
      const pile = state.foundations[index];
      if (pile.length === 0) return [];
      cards = [pile[pile.length - 1]];
    } else if (source === 'tableau') {
      const col = state.tableau[index];
      if (cardIndex < 0 || cardIndex >= col.length || !col[cardIndex].faceUp) return [];
      cards = col.slice(cardIndex);
    }

    const leadCard = cards[0];
    const targets = [];

    if (cards.length === 1 && source !== 'foundation') {
      for (let f = 0; f < 4; f++) {
        const allowed = isManualDrag
          ? canDropManualToFoundation(leadCard, f)
          : canAutoMoveToFoundation(leadCard, f);
        if (allowed) {
          targets.push({ type: 'foundation', index: f });
        }
      }
    }

    for (let c = 0; c < 7; c++) {
      if (source === 'tableau' && c === index) continue;
      if (canMoveToTableau(leadCard, c)) {
        targets.push({ type: 'tableau', index: c });
      }
    }

    return targets;
  }

  function syncFoundationSuitSlot(fIdx, placedSuit) {
    const oldSuitAtSlot = state.foundationSuits[fIdx];
    if (oldSuitAtSlot === placedSuit) return;
    const otherIdx = state.foundationSuits.indexOf(placedSuit);
    state.foundationSuits[fIdx] = placedSuit;
    if (otherIdx !== -1 && state.foundations[otherIdx].length === 0) {
      state.foundationSuits[otherIdx] = oldSuitAtSlot;
    }
  }

  function applyMove(source, index, cardIndex, target) {
    if (state.isGameOver) return null;
    pushHistory();
    let movingCards = [];

    if (source === 'waste') {
      movingCards = [state.waste.pop()];
    } else if (source === 'foundation') {
      movingCards = [state.foundations[index].pop()];
    } else if (source === 'tableau') {
      movingCards = state.tableau[index].splice(cardIndex);
      const rem = state.tableau[index];
      if (rem.length > 0 && !rem[rem.length - 1].faceUp) {
        rem[rem.length - 1].faceUp = true;
      }
    }

    const movedRank = movingCards[0] ? movingCards[0].rank : 1;

    if (target.type === 'foundation') {
      if (state.foundations[target.index].length === 0) {
        syncFoundationSuitSlot(target.index, movingCards[0].suit);
      }
      state.foundations[target.index].push(movingCards[0]);
    } else if (target.type === 'tableau') {
      state.tableau[target.index].push(...movingCards);
    }

    state.moves += 1;
    saveToStorage();
    return { type: target.type, rank: movedRank };
  }

  function drawStockCard() {
    if (state.isGameOver) return false;
    if (state.stock.length > 0) {
      pushHistory();
      const card = state.stock.pop();
      card.faceUp = true;
      state.waste.push(card);
      state.moves += 1;
      saveToStorage();
      return true;
    }
    if (state.waste.length > 0) {
      pushHistory();
      while (state.waste.length > 0) {
        const c = state.waste.pop();
        c.faceUp = false;
        state.stock.push(c);
      }
      state.moves += 1;
      saveToStorage();
      return true;
    }
    return false;
  }

  function canAutoComplete() {
    if (state.isGameOver) return false;
    for (const col of state.tableau) {
      for (const c of col) {
        if (!c.faceUp) return false;
      }
    }
    const foundationTotal = state.foundations.reduce((acc, p) => acc + p.length, 0);
    return foundationTotal < 52;
  }

  function recordVictory() {
    const prevWins = state.wins;
    state.wins += 1;
    state.isGameOver = true;
    state.history = [];

    let unlockedSomething = false;

    const newFace = C.FACE_THEMES.find(f => f.req > prevWins && f.req <= state.wins);
    if (newFace) {
      state.faceTheme = newFace.id;
      unlockedSomething = true;
    }

    const newBack = C.BACK_THEMES.find(b => b.req > prevWins && b.req <= state.wins);
    if (newBack) {
      state.backTheme = newBack.id;
      unlockedSomething = true;
    }

    if (prevWins < C.ROYAL_GOLD_REQ && state.wins >= C.ROYAL_GOLD_REQ) {
      state.royalGold = true;
      unlockedSomething = true;
    }

    saveToStorage();
    return unlockedSomething;
  }

  function findHint() {
    for (let c = 0; c < 7; c++) {
      const col = state.tableau[c];
      for (let i = 0; i < col.length; i++) {
        if (!col[i].faceUp) continue;
        if (i === 0 && col[i].rank === 13) {
          const targets = getValidTargets('tableau', c, i, false).filter(tg => tg.type === 'foundation');
          if (targets.length > 0) {
            return {
              highlight: { source: 'tableau', index: c, cardIndex: i },
              card: col[i],
              target: targets[0]
            };
          }
          continue;
        }
        const targets = getValidTargets('tableau', c, i, false);
        if (targets.length > 0) {
          return {
            highlight: { source: 'tableau', index: c, cardIndex: i },
            card: col[i],
            target: targets[0]
          };
        }
      }
    }

    if (state.waste.length > 0) {
      const wCard = state.waste[state.waste.length - 1];
      const targets = getValidTargets('waste', 0, state.waste.length - 1, false);
      if (targets.length > 0) {
        return {
          highlight: { source: 'waste', index: 0, cardIndex: state.waste.length - 1 },
          card: wCard,
          target: targets[0]
        };
      }
    }

    return null;
  }

  return {
    state,
    t,
    saveToStorage,
    loadFromStorage,
    setupNewDeal,
    restoreInitialDeal,
    popHistory,
    canAutoMoveToFoundation,
    getValidTargets,
    syncFoundationSuitSlot,
    applyMove,
    drawStockCard,
    canAutoComplete,
    recordVictory,
    findHint
  };
})();
