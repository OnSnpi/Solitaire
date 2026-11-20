window.SolitaireApp = window.SolitaireApp || {};

window.SolitaireApp.Config = (() => {
  const STORAGE_KEY = 'ondrandy_solitaire_state';
  const LEGACY_KEYS = ['ondrandy_solitaire_v13', 'ondrandy_solitaire_v12', 'ondrandy_solitaire_v11'];

  const DEFAULT_FOUNDATION_SUITS = ['hearts', 'diamonds', 'spades', 'clubs'];
  const ALL_SUITS = ['hearts', 'diamonds', 'spades', 'clubs'];
  const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  const FACE_THEMES = [
    { id: 'classic', req: 0 },
    { id: 'tinted', req: 1 },
    { id: 'watermark', req: 5 },
    { id: 'solid4', req: 10 },
    { id: 'canasta-lite', req: 17 },
    { id: 'canasta', req: 40 }
  ];

  const BACK_THEMES = [
    { id: 'blue_diamond', req: 0 },
    { id: 'navy_classic', req: 3 },
    { id: 'red_classic', req: 7 },
    { id: 'red_rosette', req: 13 },
    { id: 'red_tartan', req: 20 },
    { id: 'blue_tartan', req: 30 }
  ];

  const ROYAL_GOLD_REQ = 52;
  const ALL_MILESTONES = [1, 3, 5, 7, 10, 13, 17, 20, 30, 40, 52];

  const SUIT_PATHS = {
    spades: 'M12 2C9 6.5 4 10.2 4 14.2C4 16.9 6.1 19 8.7 19C10.1 19 11.3 18.4 12 17.4C12.7 18.4 13.9 19 15.3 19C17.9 19 20 16.9 20 14.2C20 10.2 15 6.5 12 2ZM10.4 22H13.6L12.6 17.5H11.4L10.4 22Z',
    hearts: 'M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z',
    clubs: 'M12 2.5C9.6 2.5 7.7 4.4 7.7 6.8C7.7 8.1 8.3 9.3 9.2 10.1C8.6 9.8 7.9 9.6 7.1 9.6C4.6 9.6 2.6 11.6 2.6 14.1C2.6 16.6 4.6 18.6 7.1 18.6C8.8 18.6 10.3 17.7 11.1 16.3L10.1 21.5H13.9L12.9 16.3C13.7 17.7 15.2 18.6 16.9 18.6C19.4 18.6 21.4 16.6 21.4 14.1C21.4 11.6 19.4 9.6 16.9 9.6C16.1 9.6 15.4 9.8 14.8 10.1C15.7 9.3 16.3 8.1 16.3 6.8C16.3 4.4 14.4 2.5 12 2.5Z',
    diamonds: 'M12 2L4.5 12L12 22L19.5 12L12 2Z'
  };

  const I18N = {
    cs: {
      wins: 'V\u00fdhry',
      moves: 'Tahy',
      cardsCount: 'Karet v sad\u011b',
      stock: 'Bal\u00ed\u010dek',
      undo: 'Zp\u011bt',
      rules: 'N\u00e1vod',
      hint: 'N\u00e1pov\u011bda',
      newGame: 'Nov\u00e1 hra',
      ready: 'Klepnut\u00edm ozna\u010d kartu, klepnut\u00edm na plochu dob\u00edrej, swipem doleva vra\u0165 tah.',
      noMoves: 'Pro tuto kartu nen\u00ed \u017e\u00e1dn\u00fd platn\u00fd tah.',
      multiTarget: 'V\u00edce mo\u017enost\u00ed tahu \u2013 klepnut\u00edm vyber zelen\u00fd ter\u010d\u00edk.',
      undoneStatus: 'Posledn\u00ed tah byl vr\u00e1cen zp\u011bt.',
      hintStock: 'N\u00e1pov\u011bda: Oto\u010d dal\u0161\u00ed kartu z dob\u00edrac\u00edho bal\u00ed\u010dku.',
      hintRecycle: 'N\u00e1pov\u011bda: Obnov dob\u00edrac\u00ed bal\u00ed\u010dek.',
      hintMove: 'N\u00e1pov\u011bda: P\u0159esu\u0148 kartu {card} na {target}.',
      noHints: '\u017d\u00e1dn\u00e9 dal\u0161\u00ed tahy nejsou k dispozici.',
      targetFoundation: 'odkl\u00e1dac\u00ed hrom\u00e1dku',
      targetColumn: 'sloupec {col}',
      restarted: 'Partie byla vr\u00e1cena na \u00fapln\u00fd za\u010d\u00e1tek.',
      newDealt: 'Rozd\u00e1na nov\u00e1 \u0159e\u0161iteln\u00e1 partie (52 karet).',
      autoCompleting: 'V\u0161echny karty na stole oto\u010deny \u2013 automaticky dokon\u010duji partii\u2026',
      winsReset: 'Po\u010det v\u00fdher byl vynulov\u00e1n.',
      settingsTitle: 'Nastaven\u00ed hry',
      langTitle: 'Jazyk / Language',
      soundTitle: 'Zvuky',
      hapticsTitle: 'Vibrace',
      onLabel: 'Zapnuto',
      offLabel: 'Vypnuto',
      facesTitle: 'Vzhled l\u00edc\u016f karet',
      backsTitle: 'Vzor rubu karet',
      royalTitle: 'Mistrovsk\u00e1 edice',
      royalName: 'Kr\u00e1lovsk\u00e1 zlat\u00e1 edice',
      royalActive: 'Aktivn\u00ed zlat\u00fd re\u017eim',
      royalReady: 'Odem\u010deno (klepni)',
      unlockedFree: 'Z\u00e1kladn\u00ed',
      settingsUnlockInfo: '<strong>Odemknut\u00ed bonus\u016f:</strong> 1 v\u00fdhra = T\u00f3novan\u00e9 karty, 3 = Modr\u00fd klasick\u00fd, 5 = Vodoznakov\u00fd l\u00edc, 7 = \u010cerven\u00fd klasick\u00fd, 10 = \u010cty\u0159barevn\u00fd maxikontrast, 13 = \u010cerven\u00e1 r\u016f\u017eice, 17 = Canasta p\u0159ehledn\u00e1, 20 = \u010cerven\u00fd tartan, 30 = Modr\u00fd tartan, 40 = Canasta \u017eol\u00edkov\u00e9, 52 = <strong>Kr\u00e1lovsk\u00e1 zlat\u00e1 edice</strong>.',
      restartBtn: '\u21bb Restartovat tuto hru',
      saveCloseBtn: 'Ulo\u017eit a zav\u0159\u00edt',
      newModalTitle: 'Nov\u00e1 hra',
      optNewTitle: 'Rozdat novou partii',
      optRestartTitle: '\u21bb Hr\u00e1t tuto partii od za\u010d\u00e1tku',
      cancelBtn: 'Zru\u0161it',
      winHeading: 'Gratulujeme k v\u00fdh\u0159e!',
      winSummary: 'Dokon\u010deno za {moves} tah\u016f. Celkem v\u00fdher: {wins}.',
      winNewBtn: 'Hr\u00e1t dal\u0161\u00ed partii',
      winUnlockNewHtml: 'Odem\u010dena a aktivov\u00e1na nov\u00e1 odm\u011bna v <span id="win-open-settings" class="unlock-link">Nastaven\u00ed</span>!',
      rulesTitle: 'Jak hr\u00e1t Solitaire',
      rulesUnderstandBtn: 'Rozum\u00edm, hr\u00e1t',
      rulesHtml: `
        <p>C\u00edlem hry je se\u0159adit v\u0161ech <strong>52 karet</strong> (4 barvy po 13 hodnot\u00e1ch) na 4 horn\u00ed odkl\u00e1dac\u00ed hrom\u00e1dky vzestupn\u011b od <strong>Esa (A)</strong> a\u017e po <strong>Kr\u00e1le (K)</strong>. Ka\u017ed\u00e1 rozdan\u00e1 partie je 100% \u0159e\u0161iteln\u00e1.</p>
        <p><strong>Ovl\u00e1d\u00e1n\u00ed a gesta palcem:</strong></p>
        <div class="info-box-gray">
          <ul class="rules-list">
            <li><strong>Sloupce na stole (7):</strong> Karty se skl\u00e1daj\u00ed sestupn\u011b (K, Q, J, 10\u2026 2) se st\u0159\u00edd\u00e1n\u00edm <strong>\u010derven\u00e9</strong> a <strong>\u010dern\u00e9</strong> barvy.</li>
            <li><strong>Chytr\u00e9 ukl\u00e1d\u00e1n\u00ed (A, 2, K):</strong> Klepnut\u00edm jde Eso i Dvojka rovnou na odkl\u00e1dac\u00ed hrom\u00e1dku, Kr\u00e1l se automaticky ulo\u017e\u00ed na pr\u00e1zdn\u00fd sloupec nejv\u00edce vlevo.</li>
            <li><strong>Dob\u00edrac\u00ed bal\u00ed\u010dek:</strong> Dal\u0161\u00ed kartu oto\u010d\u00ed\u0161 klepnut\u00edm na bal\u00ed\u010dek nebo kamkoli na volnou plochu stolu.</li>
            <li><strong>Gesto Zp\u011bt (\u21a9):</strong> P\u0159ejet\u00edm prstu po pr\u00e1zdn\u00e9 plo\u0161e stolu zprava doleva p\u0159es alespo\u0148 p\u016flku obrazovky vr\u00e1t\u00ed\u0161 posledn\u00ed tah zp\u011bt.</li>
          </ul>
        </div>
        <div class="info-box-green">
          <strong>Automatick\u00e9 dokon\u010den\u00ed partie:</strong><br/>
          Jakmile jsou v\u0161echny karty ve sloupc\u00edch oto\u010deny l\u00edcem nahoru, hra se sama automaticky dohraje v\u010detn\u011b dob\u00edrac\u00edho bal\u00ed\u010dku bez nutnosti ma\u010dkat dal\u0161\u00ed tla\u010d\u00edtka.
        </div>
        <p class="text-danger"><strong>Pozor:</strong> Po v\u00fdh\u0159e se historie tah\u016f uzamkne a krok Zp\u011bt se deaktivuje.</p>
        <p class="text-amber"><strong>Odm\u011bny:</strong> V\u00fdhry postupn\u011b odemykaj\u00ed T\u00f3novan\u00e9 karty (1), Modr\u00fd klasick\u00fd (3), Vodoznakov\u00fd l\u00edc (5), \u010cerven\u00fd klasick\u00fd (7), \u010cty\u0159barevn\u00fd maxikontrast (10), \u010cervenou r\u016f\u017eici (13), Canasta p\u0159ehledn\u00e1 (17), \u010cerven\u00fd tartan (20), Modr\u00fd tartan (30), Canasta \u017eol\u00edkov\u00e9 (40) a Kr\u00e1lovskou zlatou edici (52).</p>
      `,
      suitNames: {
        spades: 'Piky',
        hearts: 'Srdce',
        clubs: 'K\u0159\u00ed\u017ee',
        diamonds: 'K\u00e1ry'
      },
      faces: {
        classic: 'Klasick\u00fd kontrast',
        tinted: 'T\u00f3novan\u00e9',
        watermark: 'Vodoznakov\u00fd',
        solid4: '\u010cty\u0159barevn\u00fd maxikontrast',
        'canasta-lite': 'Canasta p\u0159ehledn\u00e1',
        canasta: 'Canasta \u017eol\u00edkov\u00e9'
      },
      backs: {
        blue_diamond: 'Modr\u00e1 s\u00ed\u0165',
        navy_classic: 'Modr\u00fd klasick\u00fd',
        red_classic: '\u010cerven\u00fd klasick\u00fd',
        red_rosette: '\u010cerven\u00e1 r\u016f\u017eice',
        red_tartan: '\u010cerven\u00fd tartan',
        blue_tartan: 'Modr\u00fd tartan'
      }
    },
    en: {
      wins: 'Wins',
      moves: 'Moves',
      cardsCount: 'Deck size',
      stock: 'Stock',
      undo: 'Undo',
      rules: 'Rules',
      hint: 'Hint',
      newGame: 'New Game',
      ready: 'Tap a card to move, tap empty board to draw, or swipe left to undo.',
      noMoves: 'No valid moves for this card.',
      multiTarget: 'Multiple targets available \u2013 tap a green target.',
      undoneStatus: 'Last move undone.',
      hintStock: 'Hint: Draw the next card from the stock pile.',
      hintRecycle: 'Hint: Recycle the waste pile back to stock.',
      hintMove: 'Hint: Move {card} to {target}.',
      noHints: 'No more moves available.',
      targetFoundation: 'foundation pile',
      targetColumn: 'column {col}',
      restarted: 'Current deal restarted from the beginning.',
      newDealt: 'New winnable game dealt (52 cards).',
      autoCompleting: 'All tableau cards face up \u2013 auto-completing game\u2026',
      winsReset: 'Win counter has been reset.',
      settingsTitle: 'Game Settings',
      langTitle: 'Jazyk / Language',
      soundTitle: 'Sound',
      hapticsTitle: 'Vibration',
      onLabel: 'On',
      offLabel: 'Off',
      facesTitle: 'Card Face Style',
      backsTitle: 'Card Back Pattern',
      royalTitle: 'Master Edition',
      royalName: 'Royal Gold Edition',
      royalActive: 'Royal Gold active',
      royalReady: 'Unlocked (tap)',
      unlockedFree: 'Default',
      settingsUnlockInfo: '<strong>Unlock Rewards:</strong> 1 win = Tinted Faces, 3 = Navy Classic, 5 = Watermark Face, 7 = Red Classic, 10 = 4-Color Max Contrast, 13 = Red Rosette, 17 = Canasta Clean, 20 = Red Tartan, 30 = Blue Tartan, 40 = Canasta Rummy, 52 = <strong>Royal Gold Edition</strong>.',
      restartBtn: '\u21bb Restart this deal',
      saveCloseBtn: 'Save and close',
      newModalTitle: 'New Game',
      optNewTitle: 'Deal new game',
      optRestartTitle: '\u21bb Restart this deal',
      cancelBtn: 'Cancel',
      winHeading: 'Congratulations!',
      winSummary: 'Completed in {moves} moves. Total wins: {wins}.',
      winNewBtn: 'Play Next Deal',
      winUnlockNewHtml: 'New reward unlocked & applied in <span id="win-open-settings" class="unlock-link">Settings</span>!',
      rulesTitle: 'How to Play Solitaire',
      rulesUnderstandBtn: 'Got it, play',
      rulesHtml: `
        <p>The goal is to build all <strong>52 cards</strong> (4 suits of 13 ranks) onto the 4 top foundation piles ascending from <strong>Ace (A)</strong> to <strong>King (K)</strong>. Every dealt game is 100% winnable.</p>
        <p><strong>Controls & One-Hand Gestures:</strong></p>
        <div class="info-box-gray">
          <ul class="rules-list">
            <li><strong>Tableau (7 columns):</strong> Build down (K, Q, J, 10\u2026 2) in alternating <strong>Red</strong> and <strong>Black</strong> colors.</li>
            <li><strong>Smart Placement (A, 2, K):</strong> Tapping Aces and Twos moves them straight to foundations; Kings automatically fill the leftmost empty column.</li>
            <li><strong>Stock Pile:</strong> Draw the next card by tapping the stock pile or any empty table area.</li>
            <li><strong>Swipe Left to Undo (\u21a9):</strong> Swipe right-to-left across at least half the screen width on empty board space to undo your last move.</li>
          </ul>
        </div>
        <div class="info-box-green">
          <strong>Automatic Game Completion:</strong><br/>
          As soon as all tableau cards are face up, the game automatically cycles the stock and finishes the deal without pressing any extra button.
        </div>
        <p class="text-danger"><strong>Note:</strong> Once a game is won, move history is locked and Undo is disabled.</p>
        <p class="text-amber"><strong>Rewards:</strong> Wins unlock Tinted Faces (1), Navy Classic (3), Watermark Face (5), Red Classic (7), 4-Color Max Contrast (10), Red Rosette (13), Canasta Clean (17), Red Tartan (20), Blue Tartan (30), Canasta Rummy (40), and Royal Gold Edition (52).</p>
      `,
      suitNames: {
        spades: 'Spades',
        hearts: 'Hearts',
        clubs: 'Clubs',
        diamonds: 'Diamonds'
      },
      faces: {
        classic: 'High-Contrast',
        tinted: 'Soft Tinted',
        watermark: 'Watermark Suit',
        solid4: '4-Color Max Contrast',
        'canasta-lite': 'Canasta Clean',
        canasta: 'Canasta Rummy'
      },
      backs: {
        blue_diamond: 'Blue Lattice',
        navy_classic: 'Navy Classic',
        red_classic: 'Red Classic',
        red_rosette: 'Red Rosette',
        red_tartan: 'Red Tartan',
        blue_tartan: 'Blue Tartan'
      }
    }
  };

  function rankLabel(r) {
    if (r === 1) return 'A';
    if (r === 11) return 'J';
    if (r === 12) return 'Q';
    if (r === 13) return 'K';
    return String(r);
  }

  function isRed(suit) {
    return suit === 'hearts' || suit === 'diamonds';
  }

  function formatWinsLabel(n, lang) {
    if (lang === 'cs') {
      if (n === 1) return '1 v\u00fdhra';
      if (n >= 2 && n <= 4) return `${n} v\u00fdhry`;
      return `${n} v\u00fdher`;
    }
    return n === 1 ? '1 win' : `${n} wins`;
  }

  function suitSVG(suit, colorOverride = null) {
    const fill = colorOverride ? `fill="${colorOverride}"` : 'fill="currentColor"';
    return `<svg viewBox="0 0 24 24" ${fill}><path d="${SUIT_PATHS[suit]}"/></svg>`;
  }

  function renderWatermarkCardSVG(card) {
    const red = isRed(card.suit);
    const ink = red ? '#dc2626' : '#0f172a';
    const rTxt = rankLabel(card.rank);
    const pathD = SUIT_PATHS[card.suit];

    const pip = (cx, cy, size, opacity = 1) => {
      const s = size / 24;
      return `<path d="${pathD}" fill="${ink}" fill-opacity="${opacity}" transform="translate(${cx}, ${cy}) scale(${s}) translate(-12, -12)"/>`;
    };

    return `
      <svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">
        ${pip(30, 44, 42, 0.14)}
        <text x="12.5" y="19" text-anchor="middle" font-size="18.5" font-weight="900" fill="${ink}" letter-spacing="-1.2">${rTxt}</text>
        ${pip(12.5, 29.5, 14, 1)}
        <g transform="translate(60, 88) rotate(180)">
          <text x="12.5" y="19" text-anchor="middle" font-size="18.5" font-weight="900" fill="${ink}" letter-spacing="-1.2">${rTxt}</text>
          ${pip(12.5, 29.5, 14, 1)}
        </g>
      </svg>`;
  }

  function renderSolid4ColorCardSVG(card) {
    const styleMap = {
      spades:   { bg: '#090d16', fg: '#ffffff' },
      clubs:    { bg: '#1e3a8a', fg: '#ffffff' },
      hearts:   { bg: '#f43f5e', fg: '#090d16' },
      diamonds: { bg: '#f59e0b', fg: '#090d16' }
    };
    const { bg, fg } = styleMap[card.suit];
    const rTxt = card.rank === 10 ? 'X' : rankLabel(card.rank);
    const s = 17.5 / 24;
    const topPip = `<path d="${SUIT_PATHS[card.suit]}" fill="${fg}" transform="translate(45, 13.5) scale(${s}) translate(-12, -12)"/>`;

    return `
      <svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="88" fill="${bg}"/>
        <text x="15.5" y="21" text-anchor="middle" font-size="22" font-weight="900" fill="${fg}">${rTxt}</text>
        ${topPip}
        <text x="30" y="76" text-anchor="middle" font-size="58" font-weight="900" fill="${fg}">${rTxt}</text>
      </svg>`;
  }

  function renderCanastaLiteCardSVG(card) {
    const red = isRed(card.suit);
    const ink = red ? '#dc2626' : '#0f172a';
    const accentBorder = red ? '#fca5a5' : '#cbd5e1';
    const rTxt = rankLabel(card.rank);
    const pathD = SUIT_PATHS[card.suit];

    const pip = (cx, cy, size = 12, invert = false) => {
      const s = size / 24;
      const tr = invert
        ? `translate(${cx}, ${cy}) rotate(180) scale(${s}) translate(-12, -12)`
        : `translate(${cx}, ${cy}) scale(${s}) translate(-12, -12)`;
      return `<path d="${pathD}" fill="${ink}" transform="${tr}"/>`;
    };

    const corners = `
      <text x="10.5" y="18.5" text-anchor="middle" font-size="18.5" font-weight="900" fill="${ink}" letter-spacing="-1">${rTxt}</text>
      ${pip(10.5, 28, 12.5, false)}
      <g transform="translate(60, 88) rotate(180)">
        <text x="10.5" y="18.5" text-anchor="middle" font-size="18.5" font-weight="900" fill="${ink}" letter-spacing="-1">${rTxt}</text>
        ${pip(10.5, 28, 12.5, false)}
      </g>
    `;

    if (card.rank >= 11) {
      return `
        <svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">
          <rect x="2.5" y="2.5" width="55" height="83" rx="4.5" fill="none" stroke="${accentBorder}" stroke-width="1"/>
          ${corners}
          <rect x="17" y="21" width="26" height="46" rx="4" fill="#fffbeb" stroke="#eab308" stroke-width="1.4"/>
          <text x="30" y="45" text-anchor="middle" font-size="22" font-weight="900" fill="${ink}">${rTxt}</text>
          ${pip(30, 57, 15, false)}
        </svg>`;
    }

    if (card.rank === 1 && card.suit === 'spades') {
      return `
        <svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">
          <rect x="2.5" y="2.5" width="55" height="83" rx="4.5" fill="none" stroke="${accentBorder}" stroke-width="1"/>
          ${corners}
          <circle cx="30" cy="46" r="15" fill="none" stroke="#0f172a" stroke-width="1.5"/>
          <path d="M24 31L27 26L30 29L33 26L36 31H24Z" fill="#eab308" stroke="#0f172a" stroke-width="0.9"/>
          ${pip(30, 46.5, 22, false)}
        </svg>`;
    }

    return `
      <svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.5" y="2.5" width="55" height="83" rx="4.5" fill="none" stroke="${accentBorder}" stroke-width="1"/>
        ${corners}
        ${pip(30, 44.5, 26, false)}
      </svg>`;
  }

  function renderCanastaCardSVG(card) {
    const red = isRed(card.suit);
    const ink = red ? '#dc2626' : '#0f172a';
    const rTxt = rankLabel(card.rank);
    const pathD = SUIT_PATHS[card.suit];

    const pip = (cx, cy, size = 12, invert = false) => {
      const s = size / 24;
      const tr = invert
        ? `translate(${cx}, ${cy}) rotate(180) scale(${s}) translate(-12, -12)`
        : `translate(${cx}, ${cy}) scale(${s}) translate(-12, -12)`;
      return `<path d="${pathD}" fill="${ink}" transform="${tr}"/>`;
    };

    const corners = `
      <text x="9.5" y="17.5" text-anchor="middle" font-size="17.5" font-weight="900" fill="${ink}" letter-spacing="-1">${rTxt}</text>
      ${pip(9.5, 26.5, 11.5, false)}
      <g transform="translate(60, 88) rotate(180)">
        <text x="9.5" y="17.5" text-anchor="middle" font-size="17.5" font-weight="900" fill="${ink}" letter-spacing="-1">${rTxt}</text>
        ${pip(9.5, 26.5, 11.5, false)}
      </g>
    `;

    const pipLayouts = {
      2: [[30, 20, false], [30, 68, true]],
      3: [[30, 20, false], [30, 44, false], [30, 68, true]],
      4: [[22, 20, false], [38, 20, false], [22, 68, true], [38, 68, true]],
      5: [[22, 20, false], [38, 20, false], [30, 44, false], [22, 68, true], [38, 68, true]],
      6: [[22, 20, false], [38, 20, false], [22, 44, false], [38, 44, false], [22, 68, true], [38, 68, true]],
      7: [[22, 20, false], [38, 20, false], [30, 32, false], [22, 44, false], [38, 44, false], [22, 68, true], [38, 68, true]],
      8: [[22, 20, false], [38, 20, false], [30, 32, false], [22, 44, false], [38, 44, false], [30, 56, true], [22, 68, true], [38, 68, true]],
      9: [[22, 18, false], [38, 18, false], [22, 35, false], [38, 35, false], [30, 44, false], [22, 53, true], [38, 53, true], [22, 70, true], [38, 70, true]],
      10: [[22, 18, false], [38, 18, false], [30, 26.5, false], [22, 35, false], [38, 35, false], [22, 53, true], [38, 53, true], [30, 61.5, true], [22, 70, true], [38, 70, true]]
    };

    if (card.rank >= 2 && card.rank <= 10) {
      const pts = pipLayouts[card.rank];
      const sz = card.rank >= 9 ? 11.2 : 12.6;
      const pipsSvg = pts.map(([x, y, inv]) => pip(x, y, sz, inv)).join('');
      return `<svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">${corners}${pipsSvg}</svg>`;
    }

    if (card.rank === 1) {
      if (card.suit === 'spades') {
        return `
          <svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">
            ${corners}
            <circle cx="30" cy="45" r="15.5" fill="none" stroke="#0f172a" stroke-width="1.6" stroke-dasharray="3 1.5"/>
            <circle cx="30" cy="45" r="12.5" fill="none" stroke="#0f172a" stroke-width="1.1"/>
            <path d="M24 30L27 25L30 28.5L33 25L36 30H24Z" fill="#eab308" stroke="#0f172a" stroke-width="0.9"/>
            ${pip(30, 45.5, 22, false)}
            <path d="M16 58Q30 63 44 58" fill="none" stroke="#0f172a" stroke-width="1.8"/>
          </svg>`;
      }
      return `<svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">${corners}${pip(30, 44.5, 26, false)}</svg>`;
    }

    const renderCourtHalf = () => {
      const robePrimary = card.rank === 13 ? '#1d4ed8' : (card.rank === 12 ? '#dc2626' : '#1d4ed8');
      const robeSecondary = card.rank === 13 ? '#dc2626' : (card.rank === 12 ? '#1d4ed8' : '#eab308');
      const crownShape = card.rank === 13
        ? `<path d="M22 18.5L24.5 13L28 16.5L30 12.5L32 16.5L35.5 13L38 18.5H22Z" fill="#facc15" stroke="#0f172a" stroke-width="0.9"/>`
        : card.rank === 12
        ? `<path d="M23 18.5L25.5 14L30 17L34.5 14L37 18.5H23Z" fill="#facc15" stroke="#0f172a" stroke-width="0.9"/>`
        : `<path d="M22 18.5L24.5 14.5H35.5L38 18.5H22Z" fill="#dc2626" stroke="#0f172a" stroke-width="0.9"/>`;
      const beard = card.rank === 13
        ? `<path d="M24.5 25C24.5 29 27.5 30.5 30 30.5C32.5 30.5 35.5 29 35.5 25" fill="none" stroke="#475569" stroke-width="1.8"/>`
        : '';

      return `
        ${pip(20.5, 20.5, 11, false)}
        <path d="M23 18.5C21.5 22 22 26.5 24 28.5H36C38 26.5 38.5 22 37 18.5Z" fill="#facc15" stroke="#0f172a" stroke-width="0.8"/>
        <ellipse cx="30" cy="23.5" rx="5" ry="5.6" fill="#fffbeb" stroke="#0f172a" stroke-width="0.9"/>
        <circle cx="28" cy="22.8" r="0.9" fill="#0f172a"/>
        <circle cx="32" cy="22.8" r="0.9" fill="#0f172a"/>
        ${beard}
        ${crownShape}
        <path d="M16.5 44V33C16.5 30 21 29 30 29C39 29 43.5 30 43.5 33V44Z" fill="${robePrimary}" stroke="#0f172a" stroke-width="0.9"/>
        <path d="M21 44L30 30L39 44Z" fill="${robeSecondary}" stroke="#0f172a" stroke-width="0.9"/>
        <path d="M25.5 44L30 34L34.5 44Z" fill="#facc15" stroke="#0f172a" stroke-width="0.8"/>
        <rect x="16.5" y="41.2" width="27" height="2.8" fill="#facc15" stroke="#0f172a" stroke-width="0.8"/>
        <path d="M40.5 37L42.5 21L44 37Z" fill="#facc15" stroke="#0f172a" stroke-width="0.8"/>
      `;
    };

    return `
      <svg class="card-full-svg" viewBox="0 0 60 88" xmlns="http://www.w3.org/2000/svg">
        ${corners}
        <rect x="16" y="11.5" width="28" height="65" fill="#ffffff" stroke="#1e3a8a" stroke-width="1.3"/>
        <g>${renderCourtHalf()}</g>
        <g transform="translate(60, 88) rotate(180)">${renderCourtHalf()}</g>
        <line x1="16" y1="44" x2="44" y2="44" stroke="#0f172a" stroke-width="1.1"/>
      </svg>`;
  }

  function eightPointStarSVG(cx, cy, rOuter, rInner) {
    let segs = '';
    for (let i = 0; i < 8; i++) {
      const a0 = (i * 45 - 90) * Math.PI / 180;
      const aMid = (i * 45 - 90 + 22.5) * Math.PI / 180;
      const a1 = (i * 45 - 90 + 45) * Math.PI / 180;
      const px = cx + rOuter * Math.cos(a0);
      const py = cy + rOuter * Math.sin(a0);
      const mx = cx + rInner * Math.cos(aMid);
      const my = cy + rInner * Math.sin(aMid);
      const qx = cx + rOuter * Math.cos(a1);
      const qy = cy + rOuter * Math.sin(a1);
      segs += `<polygon points="${cx},${cy} ${px.toFixed(2)},${py.toFixed(2)} ${mx.toFixed(2)},${my.toFixed(2)}" fill="#ef4444"/>`;
      segs += `<polygon points="${cx},${cy} ${mx.toFixed(2)},${my.toFixed(2)} ${qx.toFixed(2)},${qy.toFixed(2)}" fill="#ffffff" stroke="#ef4444" stroke-width="0.4"/>`;
    }
    return segs;
  }

  function renderCardBackSVG(themeId) {
    if (themeId === 'navy_classic') {
      return `
        <svg class="card-back-svg" viewBox="0 0 60 86" xmlns="http://www.w3.org/2000/svg">
          <rect width="60" height="86" rx="4" fill="#ffffff"/>
          <rect x="2" y="2" width="56" height="82" rx="3" fill="none" stroke="#1e3a8a" stroke-width="2.2"/>
          <rect x="5" y="5" width="50" height="76" rx="2" fill="none" stroke="#1e3a8a" stroke-width="1" stroke-dasharray="2 1.5"/>
          <rect x="7" y="7" width="46" height="72" rx="1.5" fill="url(#pat-navy-checker)" stroke="#1e3a8a" stroke-width="1.2"/>
        </svg>`;
    }
    if (themeId === 'red_classic') {
      return `
        <svg class="card-back-svg" viewBox="0 0 60 86" xmlns="http://www.w3.org/2000/svg">
          <rect width="60" height="86" rx="4" fill="#ffffff"/>
          <rect x="2" y="2" width="56" height="82" rx="3" fill="none" stroke="#dc2626" stroke-width="2.2"/>
          <rect x="5" y="5" width="50" height="76" rx="2" fill="none" stroke="#dc2626" stroke-width="1" stroke-dasharray="2 1.5"/>
          <rect x="7" y="7" width="46" height="72" rx="1.5" fill="url(#pat-red-checker)" stroke="#dc2626" stroke-width="1.2"/>
        </svg>`;
    }
    if (themeId === 'red_rosette') {
      return `
        <svg class="card-back-svg" viewBox="0 0 60 86" xmlns="http://www.w3.org/2000/svg">
          <rect width="60" height="86" rx="4" fill="#ffffff"/>
          <rect x="3" y="3" width="54" height="80" rx="2" fill="none" stroke="#ef4444" stroke-width="3.6"/>
          <rect x="6.5" y="6.5" width="47" height="73" rx="1.5" fill="none" stroke="#ef4444" stroke-width="0.9"/>
          <rect x="8.5" y="8.5" width="43" height="69" fill="url(#pat-red-hex)" stroke="#ef4444" stroke-width="0.9"/>
          <circle cx="6.5" cy="6.5" r="5.2" fill="#ffffff" stroke="#ef4444" stroke-width="1.1"/>
          ${eightPointStarSVG(6.5, 6.5, 4.6, 1.9)}
          <circle cx="53.5" cy="6.5" r="5.2" fill="#ffffff" stroke="#ef4444" stroke-width="1.1"/>
          ${eightPointStarSVG(53.5, 6.5, 4.6, 1.9)}
          <circle cx="6.5" cy="79.5" r="5.2" fill="#ffffff" stroke="#ef4444" stroke-width="1.1"/>
          ${eightPointStarSVG(6.5, 79.5, 4.6, 1.9)}
          <circle cx="53.5" cy="79.5" r="5.2" fill="#ffffff" stroke="#ef4444" stroke-width="1.1"/>
          ${eightPointStarSVG(53.5, 79.5, 4.6, 1.9)}
          <circle cx="30" cy="43" r="10.5" fill="#ffffff" stroke="#ef4444" stroke-width="1.2"/>
          <circle cx="30" cy="43" r="8.8" fill="#ef4444"/>
          ${eightPointStarSVG(30, 43, 12.5, 5.2)}
        </svg>`;
    }
    if (themeId === 'red_tartan') {
      return `
        <svg class="card-back-svg" viewBox="0 0 60 86" xmlns="http://www.w3.org/2000/svg">
          <rect width="60" height="86" rx="5" fill="url(#pat-red-tartan)"/>
          <rect x="0.75" y="0.75" width="58.5" height="84.5" rx="4.5" fill="none" stroke="#fecdd3" stroke-width="1"/>
        </svg>`;
    }
    if (themeId === 'blue_tartan') {
      return `
        <svg class="card-back-svg" viewBox="0 0 60 86" xmlns="http://www.w3.org/2000/svg">
          <rect width="60" height="86" rx="5" fill="url(#pat-blue-tartan)"/>
          <rect x="0.75" y="0.75" width="58.5" height="84.5" rx="4.5" fill="none" stroke="#bae6fd" stroke-width="1"/>
        </svg>`;
    }
    return `
      <svg class="card-back-svg" viewBox="0 0 60 86" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="86" rx="4" fill="#ffffff"/>
        <rect x="2.2" y="2.2" width="55.6" height="81.6" rx="3" fill="url(#pat-blue-diamond)"/>
      </svg>`;
  }

  return {
    STORAGE_KEY,
    LEGACY_KEYS,
    DEFAULT_FOUNDATION_SUITS,
    ALL_SUITS,
    RANKS,
    FACE_THEMES,
    BACK_THEMES,
    ROYAL_GOLD_REQ,
    ALL_MILESTONES,
    I18N,
    rankLabel,
    isRed,
    formatWinsLabel,
    suitSVG,
    renderWatermarkCardSVG,
    renderSolid4ColorCardSVG,
    renderCanastaLiteCardSVG,
    renderCanastaCardSVG,
    renderCardBackSVG
  };
})();
