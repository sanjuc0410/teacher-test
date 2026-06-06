// Multi-Stopwatch Application Logic

// Define custom theme colors mapping
const THEMES = {
  emerald: {
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  ruby: {
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.15)'
  },
  amber: {
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.15)'
  },
  sapphire: {
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.15)'
  },
  violet: {
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.15)'
  }
};

class Stopwatch {
  constructor(id, initialTheme) {
    this.id = id;
    this.isRunning = false;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.animationFrameId = null;
    this.laps = [];
    this.lastLapTime = 0;
    
    // Select DOM Elements
    this.card = document.getElementById(`sw-${id}`);
    this.titleInput = document.getElementById(`sw-title-${id}`);
    this.timeDisplay = document.getElementById(`sw-time-${id}`);
    this.msDisplay = document.getElementById(`sw-ms-${id}`);
    this.toggleBtn = document.getElementById(`sw-toggle-${id}`);
    this.lapBtn = document.getElementById(`sw-lap-${id}`);
    this.resetBtn = document.getElementById(`sw-reset-${id}`);
    this.lapsList = document.getElementById(`sw-laps-list-${id}`);
    
    this.initTheme(initialTheme);
    this.setupEvents();
  }

  initTheme(themeName) {
    this.setTheme(themeName);
    // Highlight the active dot
    const selector = this.card.querySelector('.theme-selector');
    const dots = selector.querySelectorAll('.color-dot');
    dots.forEach(dot => {
      if (dot.dataset.theme === themeName) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  setTheme(themeName) {
    this.theme = themeName;
    const themeData = THEMES[themeName];
    if (themeData) {
      this.card.style.setProperty('--theme-color', themeData.color);
      this.card.style.setProperty('--theme-glow', themeData.glow);
    }
  }

  setupEvents() {
    // Stopwatch specific button events
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.lapBtn.addEventListener('click', () => this.lap());
    this.resetBtn.addEventListener('click', () => this.reset());

    // Color Selector events
    const selector = this.card.querySelector('.theme-selector');
    selector.addEventListener('click', (e) => {
      if (e.target.classList.contains('color-dot')) {
        const dots = selector.querySelectorAll('.color-dot');
        dots.forEach(dot => dot.classList.remove('active'));
        
        e.target.classList.add('active');
        const themeSelected = e.target.dataset.theme;
        this.setTheme(themeSelected);
      }
    });
    
    // Auto-save title in case user changes focus
    this.titleInput.addEventListener('change', () => {
      if (!this.titleInput.value.trim()) {
        this.titleInput.value = `초시계 ${this.id}`;
      }
    });
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
    window.globalManager.updateDashboard();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = performance.now() - this.elapsedTime;
    this.toggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> 일시정지';
    this.toggleBtn.className = 'btn-stopwatch-toggle btn-primary';
    this.card.classList.add('active');
    this.lapBtn.disabled = false;
    
    // Start RAF render loop
    this.tick();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.elapsedTime = performance.now() - this.startTime;
    cancelAnimationFrame(this.animationFrameId);
    this.toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> 시작';
    this.toggleBtn.className = 'btn-stopwatch-toggle';
    this.card.classList.remove('active');
    this.updateDisplay();
  }

  reset() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    this.elapsedTime = 0;
    this.startTime = 0;
    this.laps = [];
    this.lastLapTime = 0;
    
    this.toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> 시작';
    this.toggleBtn.className = 'btn-stopwatch-toggle';
    this.card.classList.remove('active');
    this.lapBtn.disabled = true;
    
    this.updateDisplay();
    this.renderLaps();
    
    window.globalManager.updateDashboard();
  }

  lap() {
    if (!this.isRunning && this.elapsedTime === 0) return;
    
    const currentTotal = this.isRunning ? (performance.now() - this.startTime) : this.elapsedTime;
    const lapTime = currentTotal - this.lastLapTime;
    this.lastLapTime = currentTotal;
    
    const lapNumber = this.laps.length + 1;
    this.laps.push({
      number: lapNumber,
      lapTime: lapTime, // duration of this lap
      overallTime: currentTotal // timestamp at lap press
    });
    
    this.renderLaps();
    window.globalManager.updateDashboard();
  }

  tick() {
    if (!this.isRunning) return;
    this.elapsedTime = performance.now() - this.startTime;
    this.updateDisplay();
    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  updateDisplay() {
    const formatted = this.formatTime(this.elapsedTime);
    this.timeDisplay.textContent = formatted.timeStr;
    this.msDisplay.textContent = '.' + formatted.msStr;
  }

  formatTime(msTotal) {
    if (msTotal < 0) msTotal = 0;
    
    const hours = Math.floor(msTotal / 3600000);
    const minutes = Math.floor((msTotal % 3600000) / 60000);
    const seconds = Math.floor((msTotal % 60000) / 1000);
    const ms = Math.floor((msTotal % 1000) / 10); // 2 digit milliseconds
    
    const pad = (num, size = 2) => String(num).padStart(size, '0');
    
    let timeStr = `${pad(minutes)}:${pad(seconds)}`;
    if (hours > 0) {
      timeStr = `${pad(hours)}:${timeStr}`;
    }
    
    return {
      timeStr: timeStr,
      msStr: pad(ms)
    };
  }

  formatDuration(msTotal) {
    const hours = Math.floor(msTotal / 3600000);
    const minutes = Math.floor((msTotal % 3600000) / 60000);
    const seconds = Math.floor((msTotal % 60000) / 1000);
    const ms = Math.floor((msTotal % 1000) / 10);
    const pad = (num) => String(num).padStart(2, '0');
    return `${hours > 0 ? pad(hours) + ':' : ''}${pad(minutes)}:${pad(seconds)}.${pad(ms)}`;
  }

  renderLaps() {
    this.lapsList.innerHTML = '';
    
    if (this.laps.length === 0) return;
    
    // Find fastest and slowest laps (only if there are 2 or more laps)
    let minLapIndex = -1;
    let maxLapIndex = -1;
    if (this.laps.length > 1) {
      let minVal = Infinity;
      let maxVal = -Infinity;
      this.laps.forEach((lap, idx) => {
        if (lap.lapTime < minVal) {
          minVal = lap.lapTime;
          minLapIndex = idx;
        }
        if (lap.lapTime > maxVal) {
          maxVal = lap.lapTime;
          maxLapIndex = idx;
        }
      });
    }

    // Render laps in descending order (newest on top)
    for (let i = this.laps.length - 1; i >= 0; i--) {
      const lap = this.laps[i];
      const li = document.createElement('li');
      li.className = 'lap-item';
      
      if (i === minLapIndex) li.classList.add('fastest');
      if (i === maxLapIndex) li.classList.add('slowest');
      
      const lapNumSpan = document.createElement('span');
      lapNumSpan.className = 'lap-number';
      lapNumSpan.textContent = `Lap ${lap.number}`;
      
      const lapTimeSpan = document.createElement('span');
      lapTimeSpan.className = 'lap-time';
      lapTimeSpan.textContent = this.formatDuration(lap.lapTime);
      
      const lapDeltaSpan = document.createElement('span');
      lapDeltaSpan.className = 'lap-delta';
      lapDeltaSpan.textContent = this.formatDuration(lap.overallTime);
      
      li.appendChild(lapNumSpan);
      li.appendChild(lapTimeSpan);
      li.appendChild(lapDeltaSpan);
      
      this.lapsList.appendChild(li);
    }
  }
}

class GlobalDashboardManager {
  constructor() {
    this.stopwatches = [];
    this.activeCountEl = document.getElementById('global-active-count');
    this.lapCountEl = document.getElementById('global-lap-count');
    
    this.initStopwatches();
    this.setupGlobalEvents();
  }

  initStopwatches() {
    // Initial color schemes for our 5 stopwatches
    const defaultThemes = ['sapphire', 'ruby', 'amber', 'emerald', 'violet'];
    
    for (let i = 1; i <= 5; i++) {
      this.stopwatches.push(new Stopwatch(i, defaultThemes[i - 1]));
    }
    
    this.updateDashboard();
  }

  setupGlobalEvents() {
    document.getElementById('global-start-btn').addEventListener('click', () => {
      this.stopwatches.forEach(sw => sw.start());
      this.updateDashboard();
    });
    
    document.getElementById('global-pause-btn').addEventListener('click', () => {
      this.stopwatches.forEach(sw => sw.pause());
      this.updateDashboard();
    });
    
    document.getElementById('global-reset-btn').addEventListener('click', () => {
      if (confirm('모든 초시계 데이터를 초기화하시겠습니까?')) {
        this.stopwatches.forEach(sw => sw.reset());
        this.updateDashboard();
      }
    });
    
    document.getElementById('global-export-btn').addEventListener('click', () => {
      this.exportCSV();
    });
  }

  updateDashboard() {
    const activeCount = this.stopwatches.filter(sw => sw.isRunning).length;
    const totalLaps = this.stopwatches.reduce((acc, sw) => acc + sw.laps.length, 0);
    
    this.activeCountEl.textContent = `${activeCount} / 5`;
    this.lapCountEl.textContent = totalLaps;
  }

  exportCSV() {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // Added BOM for proper Korean rendering in Excel
    csvContent += '초시계 이름,랩 번호,구간 타임 (Lap Time),누적 타임 (Overall Time)\n';
    
    let hasData = false;
    this.stopwatches.forEach(sw => {
      const title = sw.titleInput.value.replace(/,/g, ''); // prevent CSV breaking
      if (sw.laps.length > 0) {
        hasData = true;
        sw.laps.forEach(lap => {
          csvContent += `${title},${lap.number},"${sw.formatDuration(lap.lapTime)}","${sw.formatDuration(lap.overallTime)}"\n`;
        });
      } else if (sw.elapsedTime > 0) {
        // Log even if no laps but elapsed time is present
        hasData = true;
        csvContent += `${title},전체 기록,"${sw.formatDuration(sw.elapsedTime)}","${sw.formatDuration(sw.elapsedTime)}"\n`;
      }
    });
    
    if (!hasData) {
      alert('기록된 데이터가 없어 내보내기를 할 수 없습니다. 초시계를 작동하거나 랩을 기록해 주세요.');
      return;
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    
    const date = new Date();
    const timestamp = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}_${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}`;
    link.setAttribute('download', `stopwatch_export_${timestamp}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Instantiate dashboard manager on window load
window.addEventListener('DOMContentLoaded', () => {
  window.globalManager = new GlobalDashboardManager();
});
