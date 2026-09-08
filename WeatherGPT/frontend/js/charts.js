/**
 * Charts Module
 * Visualizes 24-hour hourly weather trends using Chart.js
 */

let chartInstance = null;
let currentHourlyData = [];
let currentMetric = 'temp';

const WeatherCharts = {
  init() {
    const tabs = document.querySelectorAll('.chart-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        tabs.forEach((t) => t.classList.remove('active'));
        e.target.classList.add('active');
        currentMetric = e.target.dataset.chart;
        this.render();
      });
    });
  },

  updateData(hourly) {
    currentHourlyData = hourly || [];
    this.render();
  },

  render() {
    const canvas = document.getElementById('weatherChart');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !currentHourlyData.length) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

    const labels = currentHourlyData.map((h) => h.hourLabel);
    let dataset = {};

    if (currentMetric === 'temp') {
      const temps = currentHourlyData.map((h) => h.temperature);
      dataset = {
        label: 'Temperature (°C)',
        data: temps,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#38bdf8',
        pointRadius: 3,
        pointHoverRadius: 6
      };
    } else if (currentMetric === 'rain') {
      const rainProbs = currentHourlyData.map((h) => h.rainProbability);
      dataset = {
        label: 'Rain Probability (%)',
        data: rainProbs,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 1.5,
        type: 'bar',
        borderRadius: 4
      };
    } else if (currentMetric === 'wind') {
      const windSpeeds = currentHourlyData.map((h) => h.windSpeed);
      dataset = {
        label: 'Wind Speed (km/h)',
        data: windSpeeds,
        borderColor: '#818cf8',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#818cf8',
        pointRadius: 3
      };
    }

    chartInstance = new Chart(ctx, {
      type: dataset.type || 'line',
      data: {
        labels,
        datasets: [dataset]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? 'rgba(17, 25, 46, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#fff' : '#000',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: 'rgba(56, 189, 248, 0.3)',
            borderWidth: 1,
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, maxTicksLimit: 8, font: { family: 'Outfit', size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Outfit', size: 11 } },
            beginAtZero: currentMetric === 'rain'
          }
        }
      }
    });
  }
};

if (typeof window !== 'undefined') {
  window.WeatherCharts = WeatherCharts;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WeatherCharts;
}
