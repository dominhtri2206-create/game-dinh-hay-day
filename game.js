/**
 * ĐỈNH HAY ĐÁY? - SÀN ĐẤU ĐẦU TƯ SIÊU TỐC (MVP)
 * HTML5 Canvas Realtime Chart & Economic Market Cycle Simulator
 */

(() => {
  'use strict';

  // =========================================================================
  // 1. CONFIGURATION & CONSTANTS
  // =========================================================================
  const GAME_DURATION_SEC = 180; // 180 seconds total
  const TICK_INTERVAL_MS = 1000; // Chuẩn 1000ms: 1 giây nhảy 1 tick để người chơi kịp phân tích
  const TOTAL_TICKS = 180;       // 180 ticks = 180 giây
  const INITIAL_CASH = 100000000; // 100 triệu VNĐ
  const COOLDOWN_MS = 500;       // 0.5s anti-spam cooldown
  const NEWS_DELAY_MS = 4500;    // 4.5s đếm ngược trước khi tin tức tác động lên giá

  // Market Phase Definitions (Calibrated for 1-second steps)
  const PHASES = [
    {
      id: 'recovery',
      name: 'Phục hồi',
      badgeClass: 'cycle-recovery',
      startSec: 0,
      endSec: 40,
      description: 'Thị trường tạo đáy nghi ngờ, tích lũy nhẹ nhàng.',
      driftTRS: 0.0012,
      driftLAN: 0.0025,
      volMultiplier: 1.0
    },
    {
      id: 'euphoria',
      name: 'Hưng phấn (Bull run)',
      badgeClass: 'cycle-euphoria',
      startSec: 40,
      endSec: 95,
      description: 'Dòng tiền FOMO ồ ạt đổ vào, giá tăng vùn vụt!',
      driftTRS: 0.0045,
      driftLAN: 0.0120,
      volMultiplier: 1.5
    },
    {
      id: 'bubble',
      name: 'Bong bóng & Đỉnh',
      badgeClass: 'cycle-bubble',
      startSec: 95,
      endSec: 130,
      description: 'Biến động giật gân, phân phối đỉnh, bẫy tăng giá!',
      driftTRS: -0.0010,
      driftLAN: -0.0035,
      volMultiplier: 2.2
    },
    {
      id: 'crash',
      name: 'Suy thoái & Hoảng loạn',
      badgeClass: 'cycle-crash',
      startSec: 130,
      endSec: 180,
      description: 'Bán tháo toàn diện, cá mập xả hàng, bắt đáy đứt tay!',
      driftTRS: -0.0055,
      driftLAN: -0.0145,
      volMultiplier: 1.8
    }
  ];

  // Asset configurations (Calibrated natural variance per second)
  const ASSETS_CONFIG = {
    TRS: {
      ticker: 'TRS',
      name: 'Trà Sữa Quốc Dân',
      basePrice: 30000,
      minPrice: 4000,
      feeRate: 0.001, // 0.1%
      volatility: 0.012, // Dao động tự nhiên ~1.2%/giây
      watermark: 'TRS • 1S REALTIME'
    },
    LAN: {
      ticker: 'LAN',
      name: 'Lan Đột Biến 5 Cánh',
      basePrice: 250000,
      minPrice: 8000,
      feeRate: 0.0015, // 0.15%
      volatility: 0.038, // Dao động cực mạnh ~3.8%/giây
      watermark: 'LAN • 1S REALTIME'
    }
  };

  // 2 DEDICATED NEWS CHANNELS: TRS, LAN & VĨ MÔ TOÀN SÀN (ALL)
  const NEWS_CATALOG = [
    // --- 1. TRS NEWS (10s) ---
    {
      targetSec: 10,
      target: 'TRS',
      headline: "Bộ Y Tế chứng nhận: Uống trà sữa hợp lý giúp tăng chỉ số hưng phấn, kích cầu ngành F&B!",
      source: "chinh_thong",
      sourceName: "BÁO CHÍNH THỐNG",
      trustText: "Tin cậy: Cao",
      trustClass: "trust-high",
      cardClass: "news-chinh-thong",
      icon: "🏛️",
      impact: { asset: "TRS", factor: 0.016, ticks: 10 },
      type: "bull"
    },

    // --- 2. LAN NEWS (25s) ---
    {
      targetSec: 25,
      target: 'LAN',
      headline: "Chuyên gia vườn lan: 'Lan Var đã chiết khấu 75% từ đỉnh cũ, dòng tiền ngầm bắt đầu gom vùng đáy'.",
      source: "chuyen_gia",
      sourceName: "CHUYÊN GIA",
      trustText: "Tin cậy: Vừa",
      trustClass: "trust-medium",
      cardClass: "news-chuyen-gia",
      icon: "🧐",
      impact: { asset: "LAN", factor: 0.035, ticks: 10 },
      type: "bull"
    },

    // --- 3. VĨ MÔ TOÀN SÀN (42s) - HIỂN THỊ ĐỒNG LOẠT 2 KHUNG ---
    {
      targetSec: 42,
      target: 'ALL',
      headline: "Ngân Hàng Nhà Nước bất ngờ hạ lãi suất điều hành, dòng tiền rẻ ồ ạt kích hoạt sóng tăng toàn sàn!",
      source: "chinh_thong",
      sourceName: "VĨ MÔ CHUNG",
      trustText: "Tin cậy: Cao",
      trustClass: "trust-high",
      cardClass: "news-chinh-thong",
      icon: "🏛️",
      impact: { asset: "ALL", factor: 0.018, ticks: 12 },
      type: "bull"
    },

    // --- 4. TRS NEWS (62s) ---
    {
      targetSec: 62,
      target: 'TRS',
      headline: "TRS cán mốc doanh thu nghìn tỷ, khai trương thêm 200 điểm bán và chuẩn bị chia cổ tức bằng tiền!",
      source: "chinh_thong",
      sourceName: "BÁO CHÍNH THỐNG",
      trustText: "Tin cậy: Cao",
      trustClass: "trust-high",
      cardClass: "news-chinh-thong",
      icon: "🏛️",
      impact: { asset: "TRS", factor: 0.025, ticks: 10 },
      type: "bull"
    },

    // --- 5. LAN NEWS (80s) ---
    {
      targetSec: 80,
      target: 'LAN',
      headline: "Rò rỉ nhóm VIP: Tay to gom 20 tỷ Lan Var 5 Cánh Trắng, chuẩn bị kéo x3 giá bán trước hội chợ xuân!",
      source: "tin_don",
      sourceName: "TIN ĐỒN TAY TO",
      trustText: "Tin cậy: Thấp - Cực sốc",
      trustClass: "trust-low",
      cardClass: "news-tin-don",
      icon: "🤫",
      impact: { asset: "LAN", factor: 0.065, ticks: 11 },
      type: "hot"
    },

    // --- 6. VĨ MÔ TOÀN SÀN (96s) - HIỂN THỊ ĐỒNG LOẠT 2 KHUNG ---
    {
      targetSec: 96,
      target: 'ALL',
      headline: "Chuyên gia tài chính cảnh báo: Thị trường bước vào vùng bong bóng đầu cơ cực đại, rủi ro đảo chiều!",
      source: "chuyen_gia",
      sourceName: "VĨ MÔ CHUNG",
      trustText: "Tin cậy: Vừa",
      trustClass: "trust-medium",
      cardClass: "news-chuyen-gia",
      icon: "🧐",
      impact: { asset: "ALL", factor: -0.012, ticks: 10 },
      type: "danger"
    },

    // --- 7. LAN NEWS - BẪY PUMP & DUMP (114s) ---
    {
      targetSec: 114,
      target: 'LAN',
      headline: "Đội lái hô hào: 'LAN sắp lên 1 triệu/kie, không tất tay là lỡ cơ hội đổi đời!' - Bẫy xả phân phối đỉnh!",
      source: "tin_don",
      sourceName: "PUMP & DUMP",
      trustText: "Tin cậy: Thấp - Nguy hiểm",
      trustClass: "trust-low",
      cardClass: "news-tin-don",
      icon: "🤫",
      // Trap: kéo nhẹ 4 giây rồi sập sâu 8 giây
      impact: { asset: "LAN", factor: 0.045, ticks: 4, postDump: -0.055 },
      type: "hot"
    },

    // --- 8. LAN NEWS - SẬP HẦM (135s) ---
    {
      targetSec: 135,
      target: 'LAN',
      headline: "Bộ Công An khởi tố đường dây thổi giá Lan Var ảo tiền tỷ, phong tỏa tài khoản hàng loạt đại gia!",
      source: "chinh_thong",
      sourceName: "BÁO CHÍNH THỐNG",
      trustText: "Tin cậy: Cao",
      trustClass: "trust-high",
      cardClass: "news-chinh-thong",
      icon: "🏛️",
      impact: { asset: "LAN", factor: -0.075, ticks: 12 },
      type: "danger"
    },

    // --- 9. VĨ MÔ TOÀN SÀN (152s) - HIỂN THỊ ĐỒNG LOẠT 2 KHUNG ---
    {
      targetSec: 152,
      target: 'ALL',
      headline: "Lãi suất liên ngân hàng tăng sốc! Áp lực giải chấp margin đè nặng toàn bộ tài sản tài chính!",
      source: "chinh_thong",
      sourceName: "VĨ MÔ CHUNG",
      trustText: "Tin cậy: Cao",
      trustClass: "trust-high",
      cardClass: "news-chinh-thong",
      icon: "🏛️",
      impact: { asset: "ALL", factor: -0.032, ticks: 12 },
      type: "danger"
    },

    // --- 10. TRS NEWS (168s) ---
    {
      targetSec: 168,
      target: 'TRS',
      headline: "Tin đồn: Quỹ ngoại âm thầm giải ngân bắt đáy TRS vùng quá bán, xuất hiện lực cầu đỡ giá phút chót!",
      source: "tin_don",
      sourceName: "TIN ĐỒN HỘI NHÓM",
      trustText: "Tin cậy: Thấp",
      trustClass: "trust-low",
      cardClass: "news-tin-don",
      icon: "🤫",
      impact: { asset: "TRS", factor: 0.025, ticks: 9 },
      type: "bull"
    }
  ];

  // =========================================================================
  // 2. WEB AUDIO SYNTHESIZER (No external mp3 required)
  // =========================================================================
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playBuy() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }

    playSell() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Dual tone cash chime
      [587.33, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + 0.25);
      });
    }

    playNews() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.08); // C6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    }

    playCrash() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    }

    playGameOver(isWinner) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = isWinner ? [523.25, 659.25, 783.99, 1046.50] : [392.00, 349.23, 311.13, 261.63];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.12;
        osc.type = isWinner ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.32);
      });
    }
  }

  // =========================================================================
  // 3. MAIN GAME STATE
  // =========================================================================
  class GameState {
    constructor() {
      this.sound = new SoundManager();

      // Core parameters
      this.cash = INITIAL_CASH;
      this.holdings = {
        TRS: 0,
        LAN: 0
      };
      this.costBasis = {
        TRS: 0,
        LAN: 0
      };

      // Market Data
      this.activeAsset = 'TRS';
      this.currentTick = 0;
      this.currentSec = 0;
      this.isRunning = false;
      this.timerInterval = null;

      // Stats
      this.totalTrades = 0;
      this.totalFeesPaid = 0;
      this.profitByAsset = { TRS: 0, LAN: 0 };

      // Cooldown
      this.isCooldown = false;
      this.cooldownTimer = null;

      // Price Series & Markers
      this.market = {
        TRS: {
          currentPrice: ASSETS_CONFIG.TRS.basePrice,
          prices: [ASSETS_CONFIG.TRS.basePrice],
          markers: [], // { tick, price, type: 'BUY'|'SELL', qty, amount }
          driftMomentum: 0,
          momentumTicksLeft: 0,
          postDump: 0
        },
        LAN: {
          currentPrice: ASSETS_CONFIG.LAN.basePrice,
          prices: [ASSETS_CONFIG.LAN.basePrice],
          markers: [],
          driftMomentum: 0,
          momentumTicksLeft: 0,
          postDump: 0
        }
      };

      // Active News tracking
      this.pendingNews = []; // News waiting for 2.5s delay
      this.triggeredNewsSet = new Set();
    }

    reset() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      if (this.cooldownTimer) clearTimeout(this.cooldownTimer);

      this.cash = INITIAL_CASH;
      this.holdings = { TRS: 0, LAN: 0 };
      this.costBasis = { TRS: 0, LAN: 0 };
      this.currentTick = 0;
      this.currentSec = 0;
      this.isRunning = false;
      this.totalTrades = 0;
      this.totalFeesPaid = 0;
      this.profitByAsset = { TRS: 0, LAN: 0 };
      this.isCooldown = false;

      this.market.TRS = {
        currentPrice: ASSETS_CONFIG.TRS.basePrice,
        prices: [ASSETS_CONFIG.TRS.basePrice],
        markers: [],
        driftMomentum: 0,
        momentumTicksLeft: 0,
        postDump: 0
      };

      this.market.LAN = {
        currentPrice: ASSETS_CONFIG.LAN.basePrice,
        prices: [ASSETS_CONFIG.LAN.basePrice],
        markers: [],
        driftMomentum: 0,
        momentumTicksLeft: 0,
        postDump: 0
      };

      this.pendingNews = [];
      this.triggeredNewsSet.clear();
    }

    getCurrentPhase() {
      const sec = this.currentSec;
      for (let i = 0; i < PHASES.length; i++) {
        if (sec >= PHASES[i].startSec && sec < PHASES[i].endSec) {
          return PHASES[i];
        }
      }
      return PHASES[PHASES.length - 1];
    }

    getTotalNetWorth() {
      const valTRS = this.holdings.TRS * this.market.TRS.currentPrice;
      const valLAN = this.holdings.LAN * this.market.LAN.currentPrice;
      return this.cash + valTRS + valLAN;
    }

    getPnl() {
      const netWorth = this.getTotalNetWorth();
      const diff = netWorth - INITIAL_CASH;
      const pct = (diff / INITIAL_CASH) * 100;
      return { diff, pct, netWorth };
    }
  }

  // =========================================================================
  // 4. PRICE GENERATOR (Dynamic Stochastic with Economic Regimes)
  // =========================================================================
  function updateMarketPrices(state) {
    const phase = state.getCurrentPhase();

    ['TRS', 'LAN'].forEach(assetKey => {
      const cfg = ASSETS_CONFIG[assetKey];
      const mkt = state.market[assetKey];
      const prevPrice = mkt.currentPrice;

      // 1. Regime Drift
      let drift = assetKey === 'TRS' ? phase.driftTRS : phase.driftLAN;

      // 2. News Impact Momentum
      if (mkt.momentumTicksLeft > 0) {
        drift += mkt.driftMomentum;
        mkt.momentumTicksLeft--;
        if (mkt.momentumTicksLeft === 0 && mkt.postDump !== 0) {
          // Trap post-dump activation
          mkt.driftMomentum = mkt.postDump;
          mkt.momentumTicksLeft = 16;
          mkt.postDump = 0;
        }
      }

      // 3. Volatility & Random Shock (Box-Muller normal distribution)
      const u1 = Math.max(0.0001, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const effectiveVol = cfg.volatility * phase.volMultiplier;
      const shock = z0 * effectiveVol;

      // 4. Mean Reversion pull if deviating excessively
      let meanPull = 0;
      if (assetKey === 'TRS' && prevPrice > 90000) {
        meanPull = -0.002;
      }

      // Geometric step
      const changeRate = drift + shock + meanPull;
      let newPrice = Math.round(prevPrice * (1 + changeRate));

      // Guard minimum prices
      if (newPrice < cfg.minPrice) newPrice = cfg.minPrice;

      mkt.currentPrice = newPrice;
      mkt.prices.push(newPrice);
    });
  }

  // =========================================================================
  // 5. CANVAS RENDERER (Crisp Retina Line Chart + Markers + Crosshair)
  // =========================================================================
  class ChartRenderer {
    constructor(canvas, state) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.state = state;
      this.dpr = window.devicePixelRatio || 1;
      this.mouseX = null;
      this.mouseY = null;
      this.isHovering = false;

      this.setupListeners();
      this.resize();
    }

    setupListeners() {
      const handleMove = (clientX, clientY) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = clientX - rect.left;
        this.mouseY = clientY - rect.top;
        this.isHovering = true;
      };

      const handleLeave = () => {
        this.isHovering = false;
        const tooltip = document.getElementById('chartTooltip');
        if (tooltip) tooltip.style.display = 'none';
      };

      this.canvas.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
      this.canvas.addEventListener('mouseleave', handleLeave);

      this.canvas.addEventListener('touchmove', e => {
        if (e.touches && e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });

      this.canvas.addEventListener('touchend', handleLeave);

      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      this.canvas.width = Math.floor(width * this.dpr);
      this.canvas.height = Math.floor(height * this.dpr);

      this.width = width;
      this.height = height;
    }

    render() {
      if (!this.width || !this.height) return;

      const ctx = this.ctx;
      const assetKey = this.state.activeAsset;
      const mkt = this.state.market[assetKey];
      const prices = mkt.prices;
      const len = prices.length;
      if (len === 0) return;

      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      // Clear
      ctx.clearRect(0, 0, this.width, this.height);

      // Layout geometry
      const padding = { top: 24, right: 74, bottom: 26, left: 14 };
      const chartW = this.width - padding.left - padding.right;
      const chartH = this.height - padding.top - padding.bottom;

      // Determine viewport window: Show up to 150 recent ticks or stretch from start
      const visibleWindow = Math.min(len, 180);
      const startIndex = Math.max(0, len - visibleWindow);
      const visiblePrices = prices.slice(startIndex);

      let minP = Math.min(...visiblePrices);
      let maxP = Math.max(...visiblePrices);

      // Keep minimum dynamic range
      if (maxP === minP) {
        minP *= 0.95;
        maxP *= 1.05;
      }
      const rangeP = maxP - minP;
      const yPad = rangeP * 0.12;
      const yMin = minP - yPad;
      const yMax = maxP + yPad;

      // Coordinate mappers
      const getX = (idxInWindow) => {
        if (visiblePrices.length <= 1) return padding.left;
        return padding.left + (idxInWindow / (visiblePrices.length - 1)) * chartW;
      };

      const getY = (val) => {
        return padding.top + (1 - (val - yMin) / (yMax - yMin)) * chartH;
      };

      // 1. Gridlines & Y-Axis Labels
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const gridSteps = 4;
      for (let i = 0; i <= gridSteps; i++) {
        const val = yMin + (i / gridSteps) * (yMax - yMin);
        const y = getY(val);

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(this.width - padding.right, y);
        ctx.stroke();

        // Right side label
        const priceLabel = formatCurrencyCompact(val);
        ctx.fillText(priceLabel, this.width - padding.right + 6, y);
      }

      // Vertical time lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      const xSteps = 5;
      for (let j = 0; j <= xSteps; j++) {
        const x = padding.left + (j / xSteps) * chartW;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, this.height - padding.bottom);
        ctx.stroke();
      }

      // 2. Trend Color Detection
      const firstPrice = visiblePrices[0];
      const lastPrice = visiblePrices[visiblePrices.length - 1];
      const isBull = lastPrice >= firstPrice;
      const strokeColor = isBull ? '#00e676' : '#ff1744';
      const glowColor = isBull ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 23, 68, 0.35)';

      // 3. Area Fill Gradient
      const fillGradient = ctx.createLinearGradient(0, padding.top, 0, this.height - padding.bottom);
      if (isBull) {
        fillGradient.addColorStop(0, 'rgba(0, 230, 118, 0.22)');
        fillGradient.addColorStop(0.8, 'rgba(0, 230, 118, 0.02)');
        fillGradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');
      } else {
        fillGradient.addColorStop(0, 'rgba(255, 23, 68, 0.22)');
        fillGradient.addColorStop(0.8, 'rgba(255, 23, 68, 0.02)');
        fillGradient.addColorStop(1, 'rgba(255, 23, 68, 0.0)');
      }

      ctx.beginPath();
      if (visiblePrices.length <= 1) {
        const y0 = getY(visiblePrices[0]);
        ctx.moveTo(padding.left, y0);
        ctx.lineTo(this.width - padding.right, y0);
        ctx.lineTo(this.width - padding.right, this.height - padding.bottom);
        ctx.lineTo(padding.left, this.height - padding.bottom);
      } else {
        visiblePrices.forEach((p, idx) => {
          const x = getX(idx);
          const y = getY(p);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.lineTo(getX(visiblePrices.length - 1), this.height - padding.bottom);
        ctx.lineTo(getX(0), this.height - padding.bottom);
      }
      ctx.closePath();
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // 4. Line with Glow
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = strokeColor;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      if (visiblePrices.length <= 1) {
        const y0 = getY(visiblePrices[0]);
        ctx.moveTo(padding.left, y0);
        ctx.lineTo(this.width - padding.right, y0);
      } else {
        visiblePrices.forEach((p, idx) => {
          const x = getX(idx);
          const y = getY(p);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      }
      ctx.stroke();
      ctx.restore();

      // 5. Current Price Line & Badge (Horizontal dashed line)
      const currentY = getY(lastPrice);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, currentY);
      ctx.lineTo(this.width - padding.right, currentY);
      ctx.stroke();
      ctx.restore();

      // Pulsing Current Point
      const lastX = visiblePrices.length <= 1 ? (padding.left + chartW / 2) : getX(visiblePrices.length - 1);
      ctx.beginPath();
      ctx.arc(lastX, currentY, 4, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Price Tag on Right Edge
      ctx.fillStyle = isBull ? '#047857' : '#b91c1c';
      const badgeH = 18;
      const badgeW = padding.right - 8;
      roundRect(ctx, this.width - padding.right + 4, currentY - badgeH / 2, badgeW, badgeH, 3);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatNumber(lastPrice), this.width - padding.right + 4 + badgeW / 2, currentY);

      // 6. Transaction Markers (Buy: Green ▲, Sell: Red ▼)
      mkt.markers.forEach(marker => {
        // Check if marker tick is within currently visible window
        if (marker.tick >= startIndex && marker.tick < len) {
          const idxInWin = marker.tick - startIndex;
          const mx = getX(idxInWin);
          const my = getY(marker.price);

          const isBuy = marker.type === 'BUY';
          const markerColor = isBuy ? '#00e676' : '#ff1744';

          ctx.save();
          // Draw Marker circle
          ctx.beginPath();
          ctx.arc(mx, my, 7, 0, Math.PI * 2);
          ctx.fillStyle = isBuy ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 23, 68, 0.25)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = markerColor;
          ctx.stroke();

          // Symbol
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(isBuy ? '▲' : '▼', mx, my);

          // Small tag label
          ctx.font = 'bold 8px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = markerColor;
          ctx.fillText(isBuy ? 'MUA' : 'BÁN', mx, isBuy ? my - 12 : my + 13);
          ctx.restore();
        }
      });

      // 7. Interactive Crosshair & Tooltip
      if (this.isHovering && this.mouseX !== null) {
        if (this.mouseX >= padding.left && this.mouseX <= this.width - padding.right) {
          // Find closest tick
          const relativeX = this.mouseX - padding.left;
          const ratio = relativeX / chartW;
          const targetIndex = Math.min(
            visiblePrices.length - 1,
            Math.max(0, Math.round(ratio * (visiblePrices.length - 1)))
          );

          const hoverPrice = visiblePrices[targetIndex];
          const hoverTick = startIndex + targetIndex;
          const hoverX = getX(targetIndex);
          const hoverY = getY(hoverPrice);

          // Draw vertical crosshair
          ctx.save();
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.moveTo(hoverX, padding.top);
          ctx.lineTo(hoverX, this.height - padding.bottom);
          ctx.stroke();

          // Highlight dot
          ctx.beginPath();
          ctx.arc(hoverX, hoverY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.restore();

          // Position Tooltip element
          const tooltip = document.getElementById('chartTooltip');
          const timeSec = Math.floor((hoverTick * TICK_INTERVAL_MS) / 1000);
          const mins = String(Math.floor(timeSec / 60)).padStart(2, '0');
          const secs = String(timeSec % 60).padStart(2, '0');

          if (tooltip) {
            tooltip.style.display = 'block';
            tooltip.style.left = `${hoverX}px`;
            tooltip.style.top = `${hoverY}px`;
            document.getElementById('tooltipTime').textContent = `T + ${mins}:${secs} (Tick #${hoverTick})`;
            document.getElementById('tooltipPrice').textContent = `${formatNumber(hoverPrice)} đ`;
          }
        }
      }

      ctx.restore();
    }
  }

  // =========================================================================
  // 6. UI CONTROLLER & EVENT BINDINGS
  // =========================================================================
  class GameController {
    constructor() {
      this.state = new GameState();
      this.chart = null;

      this.dom = {
        countdownTimer: document.getElementById('countdownTimer'),
        timerCard: document.getElementById('timerCard'),
        totalNetWorth: document.getElementById('totalNetWorth'),
        pnlBadge: document.getElementById('pnlBadge'),
        pnlArrow: document.getElementById('pnlArrow'),
        pnlPercent: document.getElementById('pnlPercent'),
        pnlCashDiff: document.getElementById('pnlCashDiff'),
        cashBalance: document.getElementById('cashBalance'),
        holdingsSummary: document.getElementById('holdingsSummary'),
        cycleBadge: document.getElementById('cycleBadge'),
        cycleName: document.getElementById('cycleName'),
        soundToggleBtn: document.getElementById('soundToggleBtn'),
        soundIcon: document.getElementById('soundIcon'),

        // Start Overlay
        startOverlay: document.getElementById('startOverlay'),
        btnStartGame: document.getElementById('btnStartGame'),

        // News Channel 1: TRS
        newsCardTRS: document.getElementById('newsCardTRS'),
        newsIconTRS: document.getElementById('newsIconTRS'),
        newsSourceTRS: document.getElementById('newsSourceTRS'),
        newsTrustTRS: document.getElementById('newsTrustTRS'),
        newsTimerTRS: document.getElementById('newsTimerTRS'),
        newsCountdownTRS: document.getElementById('newsCountdownTRS'),
        newsHeadlineTRS: document.getElementById('newsHeadlineTRS'),
        newsFillTRS: document.getElementById('newsFillTRS'),

        // News Channel 2: LAN
        newsCardLAN: document.getElementById('newsCardLAN'),
        newsIconLAN: document.getElementById('newsIconLAN'),
        newsSourceLAN: document.getElementById('newsSourceLAN'),
        newsTrustLAN: document.getElementById('newsTrustLAN'),
        newsTimerLAN: document.getElementById('newsTimerLAN'),
        newsCountdownLAN: document.getElementById('newsCountdownLAN'),
        newsHeadlineLAN: document.getElementById('newsHeadlineLAN'),
        newsFillLAN: document.getElementById('newsFillLAN'),

        // Tabs
        tabTRS: document.getElementById('tabTRS'),
        tabLAN: document.getElementById('tabLAN'),
        tabPriceTRS: document.getElementById('tabPriceTRS'),
        tabChangeTRS: document.getElementById('tabChangeTRS'),
        tabPriceLAN: document.getElementById('tabPriceLAN'),
        tabChangeLAN: document.getElementById('tabChangeLAN'),

        // Quick Stats
        currPriceDisplay: document.getElementById('currPriceDisplay'),
        currHoldingDisplay: document.getElementById('currHoldingDisplay'),
        currPositionValue: document.getElementById('currPositionValue'),
        currPositionPnl: document.getElementById('currPositionPnl'),
        chartWatermark: document.getElementById('chartWatermark'),
        chartFeeBadge: document.getElementById('chartFeeBadge'),

        // Trading Buttons
        btnBuy25: document.getElementById('btnBuy25'),
        btnBuy50: document.getElementById('btnBuy50'),
        btnBuyAll: document.getElementById('btnBuyAll'),
        btnSell50: document.getElementById('btnSell50'),
        btnSellAll: document.getElementById('btnSellAll'),
        buy25Est: document.getElementById('buy25Est'),
        buy50Est: document.getElementById('buy50Est'),
        sell50Est: document.getElementById('sell50Est'),
        cooldownBar: document.getElementById('cooldownBar'),
        orderToast: document.getElementById('orderToast'),

        // Summary Modal
        summaryModal: document.getElementById('summaryModal'),
        summaryTitle: document.getElementById('summaryTitle'),
        summaryRankIcon: document.getElementById('summaryRankIcon'),
        summaryRankName: document.getElementById('summaryRankName'),
        summaryRankQuote: document.getElementById('summaryRankQuote'),
        sumFinalAsset: document.getElementById('sumFinalAsset'),
        sumPnlRate: document.getElementById('sumPnlRate'),
        sumNetProfit: document.getElementById('sumNetProfit'),
        sumTradeCount: document.getElementById('sumTradeCount'),
        sumTotalFees: document.getElementById('sumTotalFees'),
        sumBestAsset: document.getElementById('sumBestAsset'),
        btnShare: document.getElementById('btnShare'),
        btnRestart: document.getElementById('btnRestart')
      };

      this.init();
    }

    init() {
      const canvas = document.getElementById('priceChart');
      this.chart = new ChartRenderer(canvas, this.state);

      this.bindEvents();
      this.updateUI();
      this.chart.render();

      // UI Loop: Cập nhật siêu mượt (50ms) cho thanh tiến trình và đồng hồ đếm ngược 4.5s
      this.uiInterval = setInterval(() => {
        this.processPendingNews();
      }, 50);

      // Trạng thái chờ: Khóa toàn bộ nút MUA/BÁN cho đến khi bấm "Bắt đầu giao dịch"
      this.disableTradingButtons();
    }

    bindEvents() {
      // Nút bắt đầu chơi trên màn hình chờ
      if (this.dom.btnStartGame) {
        this.dom.btnStartGame.addEventListener('click', () => this.startGame());
      }

      // Sound Toggle
      this.dom.soundToggleBtn.addEventListener('click', () => {
        const enabled = this.state.sound.toggle();
        this.dom.soundIcon.textContent = enabled ? '🔊' : '🔇';
      });

      // Asset Tabs
      this.dom.tabTRS.addEventListener('click', () => this.switchAsset('TRS'));
      this.dom.tabLAN.addEventListener('click', () => this.switchAsset('LAN'));

      // Buy Buttons
      this.dom.btnBuy25.addEventListener('click', () => this.executeBuy(0.25));
      this.dom.btnBuy50.addEventListener('click', () => this.executeBuy(0.50));
      this.dom.btnBuyAll.addEventListener('click', () => this.executeBuy(1.00));

      // Sell Buttons
      this.dom.btnSell50.addEventListener('click', () => this.executeSell(0.50));
      this.dom.btnSellAll.addEventListener('click', () => this.executeSell(1.00));

      // Modal Buttons
      this.dom.btnRestart.addEventListener('click', () => this.restartGame());
      this.dom.btnShare.addEventListener('click', () => this.shareResult());
    }

    startGame() {
      this.state.sound.init();
      if (this.dom.startOverlay) {
        this.dom.startOverlay.style.display = 'none';
      }

      // Đảm bảo biểu đồ vừa khít kích thước khung hiển thị
      if (this.chart) {
        this.chart.resize();
        this.chart.render();
      }

      // Mở khóa các nút lệnh
      this.enableTradingButtons();

      // Bắt đầu nhịp sàn (1 tick = 1000ms = 1 giây)
      this.startSession();
      this.state.sound.playBuy();
      this.showToast('🚀 Phiên giao dịch chính thức mở cửa!', 'success');
    }

    enableTradingButtons() {
      [this.dom.btnBuy25, this.dom.btnBuy50, this.dom.btnBuyAll, this.dom.btnSell50, this.dom.btnSellAll].forEach(btn => {
        btn.removeAttribute('disabled');
        btn.classList.remove('disabled');
      });
    }

    disableTradingButtons() {
      [this.dom.btnBuy25, this.dom.btnBuy50, this.dom.btnBuyAll, this.dom.btnSell50, this.dom.btnSellAll].forEach(btn => {
        btn.setAttribute('disabled', 'true');
        btn.classList.add('disabled');
      });
    }

    switchAsset(ticker) {
      if (this.state.activeAsset === ticker) return;
      this.state.activeAsset = ticker;

      if (ticker === 'TRS') {
        this.dom.tabTRS.classList.add('active');
        this.dom.tabLAN.classList.remove('active');
        this.dom.chartWatermark.textContent = ASSETS_CONFIG.TRS.watermark;
        this.dom.chartFeeBadge.textContent = 'Phí GD: 0.10%';
      } else {
        this.dom.tabLAN.classList.add('active');
        this.dom.tabTRS.classList.remove('active');
        this.dom.chartWatermark.textContent = ASSETS_CONFIG.LAN.watermark;
        this.dom.chartFeeBadge.textContent = 'Phí GD: 0.15%';
      }

      this.updateUI();
      this.chart.render();
    }

    startSession() {
      this.state.isRunning = true;
      this.state.timerInterval = setInterval(() => {
        this.onTick();
      }, TICK_INTERVAL_MS);
    }

    onTick() {
      this.state.currentTick++;
      this.state.currentSec = this.state.currentTick; // 1 tick = 1 giây chuẩn 1000ms

      // Kiểm tra Tin tức lên sóng
      this.checkNewsTriggers();

      // Cập nhật giá theo mô hình xác suất tự nhiên
      updateMarketPrices(this.state);

      // Vẽ lại biểu đồ & cập nhật giao diện
      this.chart.render();
      this.updateUI();

      // Kiểm tra hết giờ (180 giây = 180 ticks)
      if (this.state.currentTick >= TOTAL_TICKS) {
        this.endSession();
      }
    }

    // Kiểm tra và đẩy tin tức vào hàng chờ
    checkNewsTriggers() {
      const curSec = this.state.currentSec;
      NEWS_CATALOG.forEach(item => {
        if (item.targetSec === curSec && !this.state.triggeredNewsSet.has(item.targetSec)) {
          this.state.triggeredNewsSet.add(item.targetSec);
          this.queueNews(item);
        }
      });
    }

    // Đẩy tin tức lên 2 khung riêng biệt (TRS / LAN) hoặc đồng loạt cả 2 khi có tin Vĩ mô
    queueNews(newsItem) {
      this.state.sound.playNews();

      const startTime = Date.now();
      const newsObject = {
        ...newsItem,
        startTime,
        delayMs: NEWS_DELAY_MS, // 4500ms (4.5 giây đếm ngược)
        applied: false
      };
      this.state.pendingNews.push(newsObject);

      const target = newsItem.target;

      const renderCard = (cardEl, iconEl, srcEl, trustEl, countdownEl, headlineEl, fillEl, isMacro) => {
        cardEl.className = 'news-card ' + (newsItem.cardClass || 'news-chinh-thong') + (isMacro ? ' macro-alert' : '');
        iconEl.textContent = newsItem.icon;
        srcEl.textContent = isMacro ? 'VĨ MÔ CHUNG' : newsItem.sourceName;
        trustEl.textContent = newsItem.trustText;
        trustEl.className = 'news-trust-badge ' + newsItem.trustClass;
        headlineEl.textContent = newsItem.headline;

        // Slide & Pop Animation
        headlineEl.classList.remove('news-pop');
        void headlineEl.offsetWidth;
        headlineEl.classList.add('news-pop');

        // Bắt đầu đếm ngược 4.5s
        countdownEl.parentElement.classList.remove('impacting');
        countdownEl.textContent = '4.5s';
        fillEl.style.width = '100%';
        fillEl.classList.remove('done');
      };

      if (target === 'TRS') {
        renderCard(this.dom.newsCardTRS, this.dom.newsIconTRS, this.dom.newsSourceTRS, this.dom.newsTrustTRS, this.dom.newsCountdownTRS, this.dom.newsHeadlineTRS, this.dom.newsFillTRS, false);
        this.showToast(`📢 TRS: Tin mới vừa lên sàn! (Tác động sau 4.5s)`, 'warn');
      } else if (target === 'LAN') {
        renderCard(this.dom.newsCardLAN, this.dom.newsIconLAN, this.dom.newsSourceLAN, this.dom.newsTrustLAN, this.dom.newsCountdownLAN, this.dom.newsHeadlineLAN, this.dom.newsFillLAN, false);
        this.showToast(`📢 LAN: Tin mới vừa lên sàn! (Tác động sau 4.5s)`, 'warn');
      } else if (target === 'ALL') {
        // VĨ MÔ: Hiển thị đồng loạt ở cả 2 khung với viền đỏ nổi bật!
        renderCard(this.dom.newsCardTRS, this.dom.newsIconTRS, this.dom.newsSourceTRS, this.dom.newsTrustTRS, this.dom.newsCountdownTRS, this.dom.newsHeadlineTRS, this.dom.newsFillTRS, true);
        renderCard(this.dom.newsCardLAN, this.dom.newsIconLAN, this.dom.newsSourceLAN, this.dom.newsTrustLAN, this.dom.newsCountdownLAN, this.dom.newsHeadlineLAN, this.dom.newsFillLAN, true);
        this.state.sound.playCrash();
        this.showToast(`🚨 TIN VĨ MÔ TOÀN SÀN: Ảnh hưởng cả 2 mã! (Tác động sau 4.5s)`, 'danger');
      }
    }

    // Xử lý đếm ngược 4.5s và thanh tiến trình liên tục
    processPendingNews() {
      const now = Date.now();
      for (let i = this.state.pendingNews.length - 1; i >= 0; i--) {
        const pNews = this.state.pendingNews[i];
        const elapsed = now - pNews.startTime;
        const remaining = Math.max(0, pNews.delayMs - elapsed);

        const secondsLeft = (remaining / 1000).toFixed(1);
        const pctWidth = (remaining / pNews.delayMs) * 100;

        const updateTimer = (countdownEl, fillEl) => {
          if (remaining > 0) {
            countdownEl.textContent = `${secondsLeft}s`;
            fillEl.style.width = `${pctWidth}%`;
          }
        };

        if (pNews.target === 'TRS') {
          updateTimer(this.dom.newsCountdownTRS, this.dom.newsFillTRS);
        } else if (pNews.target === 'LAN') {
          updateTimer(this.dom.newsCountdownLAN, this.dom.newsFillLAN);
        } else if (pNews.target === 'ALL') {
          updateTimer(this.dom.newsCountdownTRS, this.dom.newsFillTRS);
          updateTimer(this.dom.newsCountdownLAN, this.dom.newsFillLAN);
        }

        // Kích hoạt khi hết 4.5s
        if (remaining <= 0 && !pNews.applied) {
          pNews.applied = true;

          const setImpacting = (countdownEl, fillEl) => {
            countdownEl.parentElement.classList.add('impacting');
            countdownEl.textContent = '💥 Đang tác động!';
            fillEl.style.width = '0%';
            fillEl.classList.add('done');
          };

          if (pNews.target === 'TRS') {
            setImpacting(this.dom.newsCountdownTRS, this.dom.newsFillTRS);
          } else if (pNews.target === 'LAN') {
            setImpacting(this.dom.newsCountdownLAN, this.dom.newsFillLAN);
          } else if (pNews.target === 'ALL') {
            setImpacting(this.dom.newsCountdownTRS, this.dom.newsFillTRS);
            setImpacting(this.dom.newsCountdownLAN, this.dom.newsFillLAN);
          }

          this.applyNewsImpact(pNews);
          this.state.pendingNews.splice(i, 1);
        }
      }
    }

    applyNewsImpact(pNews) {
      const { asset, factor, ticks, postDump } = pNews.impact;

      const applyToAsset = (key) => {
        const mkt = this.state.market[key];
        mkt.driftMomentum = factor;
        mkt.momentumTicksLeft = ticks;
        mkt.postDump = postDump || 0;
      };

      if (asset === 'ALL') {
        applyToAsset('TRS');
        applyToAsset('LAN');
      } else {
        applyToAsset(asset);
      }

      if (factor < -0.02) {
        this.state.sound.playCrash();
        this.showToast(`💥 Thị trường bắt đầu hứng chịu cú sốc tin tức!`, 'danger');
      } else {
        this.showToast(`⚡ Tin tức bắt đầu tác động trực tiếp vào đường giá!`, 'warn');
      }
    }

    // =======================================================================
    // TRADING ACTIONS (Buy / Sell / Anti-spam Cooldown)
    // =======================================================================
    triggerCooldown() {
      this.state.isCooldown = true;
      this.dom.cooldownBar.style.width = '100%';
      this.dom.cooldownBar.style.transition = 'none';

      // Disable buttons
      [this.dom.btnBuy25, this.dom.btnBuy50, this.dom.btnBuyAll, this.dom.btnSell50, this.dom.btnSellAll].forEach(btn => {
        btn.classList.add('disabled');
      });

      // Animate cooldown
      requestAnimationFrame(() => {
        this.dom.cooldownBar.style.transition = `width ${COOLDOWN_MS}ms linear`;
        this.dom.cooldownBar.style.width = '0%';
      });

      if (this.state.cooldownTimer) clearTimeout(this.state.cooldownTimer);
      this.state.cooldownTimer = setTimeout(() => {
        this.state.isCooldown = false;
        [this.dom.btnBuy25, this.dom.btnBuy50, this.dom.btnBuyAll, this.dom.btnSell50, this.dom.btnSellAll].forEach(btn => {
          btn.classList.remove('disabled');
        });
      }, COOLDOWN_MS);
    }

    executeBuy(fraction) {
      if (this.state.isCooldown || !this.state.isRunning) return;

      const assetKey = this.state.activeAsset;
      const cfg = ASSETS_CONFIG[assetKey];
      const currentPrice = this.state.market[assetKey].currentPrice;

      const allocatedCash = this.state.cash * fraction;
      if (allocatedCash < currentPrice * (1 + cfg.feeRate)) {
        this.showToast('⚠️ Không đủ tiền mặt để mua tối thiểu 1 đơn vị!', 'warn');
        return;
      }

      // Calculate quantity with fee accounted for
      const cashForShares = allocatedCash / (1 + cfg.feeRate);
      const quantity = Math.floor(cashForShares / currentPrice);
      if (quantity <= 0) {
        this.showToast('⚠️ Số tiền phân bổ quá nhỏ!', 'warn');
        return;
      }

      const rawAmount = quantity * currentPrice;
      const fee = rawAmount * cfg.feeRate;
      const totalCost = rawAmount + fee;

      // Deduct cash & update state
      this.state.cash -= totalCost;
      const prevQty = this.state.holdings[assetKey];
      const prevCost = this.state.costBasis[assetKey];

      this.state.holdings[assetKey] += quantity;
      this.state.costBasis[assetKey] = prevCost + totalCost;

      this.state.totalTrades++;
      this.state.totalFeesPaid += fee;

      // Add Buy Marker
      this.state.market[assetKey].markers.push({
        id: `M_${Date.now()}`,
        tick: this.state.currentTick,
        price: currentPrice,
        type: 'BUY',
        quantity,
        amount: totalCost
      });

      this.state.sound.playBuy();
      this.triggerCooldown();
      this.showToast(`✅ Khớp MUA ${quantity} ${assetKey} giá ${formatNumber(currentPrice)}đ (Phí: ${formatNumber(fee)}đ)`, 'success');
      this.updateUI();
      this.chart.render();
    }

    executeSell(fraction) {
      if (this.state.isCooldown || !this.state.isRunning) return;

      const assetKey = this.state.activeAsset;
      const cfg = ASSETS_CONFIG[assetKey];
      const currentPrice = this.state.market[assetKey].currentPrice;
      const holding = this.state.holdings[assetKey];

      if (holding <= 0) {
        this.showToast(`⚠️ Bạn không nắm giữ bất kỳ ${assetKey} nào để bán!`, 'warn');
        return;
      }

      let quantity = fraction === 1 ? holding : Math.floor(holding * fraction);
      if (quantity <= 0) quantity = 1;

      const rawRevenue = quantity * currentPrice;
      const fee = rawRevenue * cfg.feeRate;
      const netReceived = rawRevenue - fee;

      // Track Profit / Loss
      const avgCostPerShare = this.state.costBasis[assetKey] / holding;
      const soldCost = avgCostPerShare * quantity;
      const profit = netReceived - soldCost;
      this.state.profitByAsset[assetKey] += profit;

      // Update state
      this.state.cash += netReceived;
      this.state.holdings[assetKey] -= quantity;
      this.state.costBasis[assetKey] -= soldCost;
      if (this.state.holdings[assetKey] <= 0) {
        this.state.costBasis[assetKey] = 0;
      }

      this.state.totalTrades++;
      this.state.totalFeesPaid += fee;

      // Add Sell Marker
      this.state.market[assetKey].markers.push({
        id: `M_${Date.now()}`,
        tick: this.state.currentTick,
        price: currentPrice,
        type: 'SELL',
        quantity,
        amount: netReceived
      });

      this.state.sound.playSell();
      this.triggerCooldown();
      const pnlSign = profit >= 0 ? '+' : '';
      this.showToast(`⚡ BÁN ${quantity} ${assetKey} thu về ${formatNumber(netReceived)}đ (${pnlSign}${formatNumber(profit)}đ)`, profit >= 0 ? 'success' : 'warn');
      this.updateUI();
      this.chart.render();
    }

    showToast(message, type = 'info') {
      const toast = this.dom.orderToast;
      toast.textContent = message;
      toast.className = `order-toast visible ${type}`;

      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.className = 'order-toast';
      }, 2200);
    }

    // =======================================================================
    // UI UPDATES & DOM SYNC
    // =======================================================================
    updateUI() {
      const remainingSec = Math.max(0, GAME_DURATION_SEC - this.state.currentSec);
      const mins = String(Math.floor(remainingSec / 60)).padStart(2, '0');
      const secs = String(remainingSec % 60).padStart(2, '0');
      this.dom.countdownTimer.textContent = `${mins}:${secs}`;

      if (remainingSec <= 20) {
        this.dom.timerCard.classList.add('urgency');
      } else {
        this.dom.timerCard.classList.remove('urgency');
      }

      // Net Worth & PnL
      const { diff, pct, netWorth } = this.state.getPnl();
      this.dom.totalNetWorth.textContent = `${formatNumber(netWorth)} đ`;

      const isUp = diff >= 0;
      this.dom.pnlBadge.className = `profit-badge ${diff === 0 ? 'neutral' : (isUp ? 'up' : 'down')}`;
      this.dom.pnlArrow.textContent = isUp ? '▲' : '▼';
      this.dom.pnlPercent.textContent = `${isUp ? '+' : ''}${pct.toFixed(2)}%`;
      this.dom.pnlCashDiff.textContent = `(${isUp ? '+' : ''}${formatNumber(diff)} đ)`;

      // Cash & Holdings
      this.dom.cashBalance.textContent = `${formatNumber(this.state.cash)} đ`;
      this.dom.holdingsSummary.textContent = `TRS: ${formatNumber(this.state.holdings.TRS)} | LAN: ${formatNumber(this.state.holdings.LAN)}`;

      // Economic Cycle Badge
      const phase = this.state.getCurrentPhase();
      this.dom.cycleName.textContent = phase.name;
      this.dom.cycleBadge.className = `meta-cycle ${phase.badgeClass}`;

      // Tab prices & changes
      ['TRS', 'LAN'].forEach(ticker => {
        const mkt = this.state.market[ticker];
        const base = ASSETS_CONFIG[ticker].basePrice;
        const cur = mkt.currentPrice;
        const changePct = ((cur - base) / base) * 100;
        const isBull = changePct >= 0;

        const priceEl = ticker === 'TRS' ? this.dom.tabPriceTRS : this.dom.tabPriceLAN;
        const changeEl = ticker === 'TRS' ? this.dom.tabChangeTRS : this.dom.tabChangeLAN;

        priceEl.textContent = `${formatNumber(cur)} đ`;
        changeEl.textContent = `${isBull ? '+' : ''}${changePct.toFixed(2)}%`;
        changeEl.className = `tab-change mono ${isBull ? 'up' : 'down'}`;
      });

      // Quick bar for active asset
      const activeTicker = this.state.activeAsset;
      const activePrice = this.state.market[activeTicker].currentPrice;
      const holding = this.state.holdings[activeTicker];
      const positionVal = holding * activePrice;

      this.dom.currPriceDisplay.textContent = `${formatNumber(activePrice)} đ`;
      this.dom.currHoldingDisplay.textContent = `${formatNumber(holding)} cp`;
      this.dom.currPositionValue.textContent = `${formatNumber(positionVal)} đ`;

      if (holding > 0) {
        const avgCost = this.state.costBasis[activeTicker] / holding;
        const posDiff = (activePrice - avgCost) * holding;
        const posPct = ((activePrice - avgCost) / avgCost) * 100;
        const posUp = posDiff >= 0;
        this.dom.currPositionPnl.textContent = `${posUp ? '+' : ''}${posPct.toFixed(1)}% (${posUp ? '+' : ''}${formatNumber(posDiff)}đ)`;
        this.dom.currPositionPnl.style.color = posUp ? 'var(--color-green)' : 'var(--color-red)';
      } else {
        this.dom.currPositionPnl.textContent = '--';
        this.dom.currPositionPnl.style.color = 'var(--text-muted)';
      }

      // Button estimate labels
      const buy25Amt = this.state.cash * 0.25;
      const buy50Amt = this.state.cash * 0.50;
      this.dom.buy25Est.textContent = formatCurrencyCompact(buy25Amt);
      this.dom.buy50Est.textContent = formatCurrencyCompact(buy50Amt);
      this.dom.sell50Est.textContent = holding > 0 ? `${formatNumber(Math.floor(holding * 0.5))} cp` : '0 cp';
    }

    // =======================================================================
    // 7. GAME OVER & SUMMARY MODAL
    // =======================================================================
    endSession() {
      if (this.state.timerInterval) clearInterval(this.state.timerInterval);
      this.state.isRunning = false;

      // Auto-liquidate any remaining shares at final tick's closing market price
      ['TRS', 'LAN'].forEach(assetKey => {
        const qty = this.state.holdings[assetKey];
        if (qty > 0) {
          const cfg = ASSETS_CONFIG[assetKey];
          const price = this.state.market[assetKey].currentPrice;
          const gross = qty * price;
          const fee = gross * cfg.feeRate;
          const net = gross - fee;

          this.state.cash += net;
          this.state.totalFeesPaid += fee;
          this.state.holdings[assetKey] = 0;
        }
      });

      const { diff, pct, netWorth } = this.state.getPnl();
      const isWinner = pct >= 0;
      this.state.sound.playGameOver(isWinner);

      // Rank evaluation
      const rank = evaluateRank(pct);

      // Populate Summary Modal
      this.dom.summaryRankIcon.textContent = rank.icon;
      this.dom.summaryRankName.textContent = rank.title;
      this.dom.summaryRankQuote.textContent = `"${rank.quote}"`;

      this.dom.sumFinalAsset.textContent = `${formatNumber(netWorth)} đ`;
      this.dom.sumPnlRate.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      this.dom.sumPnlRate.style.color = pct >= 0 ? 'var(--color-green)' : 'var(--color-red)';

      this.dom.sumNetProfit.textContent = `${diff >= 0 ? '+' : ''}${formatNumber(diff)} đ`;
      this.dom.sumNetProfit.style.color = diff >= 0 ? 'var(--color-green)' : 'var(--color-red)';

      this.dom.sumTradeCount.textContent = `${this.state.totalTrades} lệnh`;
      this.dom.sumTotalFees.textContent = `${formatNumber(Math.round(this.state.totalFeesPaid))} đ`;

      // Best asset
      let best = 'Chưa giao dịch';
      if (this.state.profitByAsset.TRS > 0 || this.state.profitByAsset.LAN > 0) {
        if (this.state.profitByAsset.TRS >= this.state.profitByAsset.LAN) {
          best = `Trà Sữa TRS (+${formatNumber(this.state.profitByAsset.TRS)} đ)`;
        } else {
          best = `Lan Đột Biến LAN (+${formatNumber(this.state.profitByAsset.LAN)} đ)`;
        }
      } else if (this.state.totalTrades > 0) {
        best = 'Cả 2 mã đều đu đỉnh 😭';
      }
      this.dom.sumBestAsset.textContent = best;

      // Show modal
      this.dom.summaryModal.style.display = 'flex';
    }

    resetNewsCards() {
      const resetOne = (cardEl, iconEl, srcEl, trustEl, countdownEl, headlineEl, fillEl, assetName) => {
        cardEl.className = 'news-card news-chinh-thong';
        iconEl.textContent = '🏛️';
        srcEl.textContent = 'CHÍNH THỐNG';
        if (trustEl) {
          trustEl.textContent = 'Tin cậy: Cao';
          trustEl.className = 'news-trust-badge trust-high';
        }
        headlineEl.textContent = `Chưa có tin mới cho ${assetName}. Thị trường đang mở cửa thăm dò.`;
        if (countdownEl && countdownEl.parentElement) {
          countdownEl.parentElement.classList.remove('impacting');
        }
        countdownEl.textContent = '--';
        fillEl.style.width = '0%';
        fillEl.classList.remove('done');
      };

      resetOne(this.dom.newsCardTRS, this.dom.newsIconTRS, this.dom.newsSourceTRS, this.dom.newsTrustTRS, this.dom.newsCountdownTRS, this.dom.newsHeadlineTRS, this.dom.newsFillTRS, 'TRS');
      resetOne(this.dom.newsCardLAN, this.dom.newsIconLAN, this.dom.newsSourceLAN, this.dom.newsTrustLAN, this.dom.newsCountdownLAN, this.dom.newsHeadlineLAN, this.dom.newsFillLAN, 'LAN');
    }

    restartGame() {
      this.dom.summaryModal.style.display = 'none';
      this.state.reset();

      // Reset 2 khung tin tức
      this.resetNewsCards();

      // Hiện lại màn hình chờ & khóa nút giao dịch
      if (this.dom.startOverlay) {
        this.dom.startOverlay.style.display = 'flex';
      }
      this.disableTradingButtons();

      this.switchAsset('TRS');
      this.updateUI();
      this.chart.resize();
      this.chart.render();
    }

    shareResult() {
      const { pct, netWorth } = this.state.getPnl();
      const rank = evaluateRank(pct);
      const text = `🏆 [ĐỈNH HAY ĐÁY?] Vừa kết thúc phiên giao dịch 180s:\n` +
        `• Danh hiệu: ${rank.icon} ${rank.title}\n` +
        `• Tổng tài sản: ${formatNumber(netWorth)} VNĐ (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)\n` +
        `• Số lệnh: ${this.state.totalTrades} lệnh\n` +
        `"${rank.quote}"\n` +
        `Bạn có dám vào bắt đáy hay sẽ đu đỉnh? Thử ngay!`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.showToast('📋 Đã sao chép thành tích vào bộ nhớ tạm!', 'success');
        }).catch(() => {
          prompt('Sao chép kết quả của bạn:', text);
        });
      } else {
        prompt('Sao chép kết quả của bạn:', text);
      }
    }
  }

  // =========================================================================
  // 8. RANKINGS & FORMATTING UTILITIES
  // =========================================================================
  function evaluateRank(pnlPercent) {
    if (pnlPercent > 500) {
      return {
        icon: '🦈',
        title: 'Cá Mập Phố Wall',
        quote: 'Bậc thầy thao túng thị trường, tay to khét tiếng vơ trọn thanh khoản!'
      };
    } else if (pnlPercent >= 200) {
      return {
        icon: '🚀',
        title: 'Phù Thủy Đầu Tư',
        quote: 'Bắt đúng chân sóng, chốt đúng đỉnh chóp với trực giác thiên tài!'
      };
    } else if (pnlPercent >= 50) {
      return {
        icon: '📈',
        title: 'Nhà Đầu Tư Bản Lĩnh',
        quote: 'Lướt sóng chuẩn chỉ, outplay đám đông và bỏ túi lợi nhuận ấn tượng!'
      };
    } else if (pnlPercent >= 10) {
      return {
        icon: '☕',
        title: 'Trader Trà Đá',
        quote: 'Gặt nhẹ vài vòng sóng, kiếm đủ tiền uống trà sữa no nê cả năm!'
      };
    } else if (pnlPercent >= -10) {
      return {
        icon: '🛡️',
        title: 'Thần Giữ Của',
        quote: 'Bảo toàn nguyên vẹn vốn gốc qua giông bão, sống sót là còn cơ hội!'
      };
    } else if (pnlPercent >= -40) {
      return {
        icon: '📉',
        title: 'F0 Lạc Lối',
        quote: 'Vào nhầm nhịp điều chỉnh, nộp học phí cho thị trường hơi hào phóng!'
      };
    } else if (pnlPercent >= -70) {
      return {
        icon: '🤡',
        title: 'Thợ Cắt Lỗ Chuyên Nghiệp',
        quote: 'Mua đỉnh bán đáy không lệch một li, tay to vừa xả là có mặt gom hộ!'
      };
    } else {
      return {
        icon: '🧗',
        title: 'Chiến Thần Đu Đỉnh',
        quote: 'Đỉnh cao chót vót mây mù bao phủ, ngắm nhìn đồng bằng trong cơn gió lạnh buốt!'
      };
    }
  }

  function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Math.round(num).toLocaleString('vi-VN');
  }

  function formatCurrencyCompact(val) {
    if (val >= 1000000000) {
      return (val / 1000000000).toFixed(1) + 'Tỷ';
    }
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'Tr';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return Math.round(val).toString();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // =========================================================================
  // BOOTSTRAP
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    new GameController();
  });

})();
