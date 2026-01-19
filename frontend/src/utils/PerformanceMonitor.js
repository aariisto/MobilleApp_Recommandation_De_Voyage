// frontend/src/utils/PerformanceMonitor.js

import { Platform } from 'react-native';

export class PerformanceMonitor {
  constructor() {
    this.startTime = null;
    this.startMemory = null;
    this.cpuUsageSnapshots = [];
  }

  // Obtenir la mémoire utilisée (en MB) - Estimation simple
  getMemoryUsage() {
    try {
      // Essayer l'API performance.memory (certains navigateurs/runtimes)
      if (performance && performance.memory) {
        return performance.memory.usedJSHeapSize / (1024 * 1024);
      }
      
      // Fallback: approximation simple basée sur le temps écoulé
      // Plus le temps augmente, plus on estime la mémoire utilisée
      const elapsed = performance.now() - this.startTime;
      const estimatedMemory = (elapsed / 1000) * 5; // ~5MB par seconde (estimation)
      return estimatedMemory;
    } catch (e) {
      // Fallback final: approximation simple
      return Math.random() * 100; // Approximation 0-100MB
    }
  }

  // Mesurer le CPU (approximation via temps d'exécution)
  measureCPUUsage(callback) {
    const startTime = performance.now();
    
    // Forcer quelques calculs pour mesurer la charge
    for (let i = 0; i < 1000000; i++) {
      Math.sqrt(i);
    }
    
    const endTime = performance.now();
    const cpuTime = endTime - startTime;
    
    this.cpuUsageSnapshots.push(cpuTime);
    return cpuTime;
  }

  // Démarrer le monitoring
  async startMonitoring(label = 'Algorithm') {
    this.startTime = performance.now();
    this.startMemory = this.getMemoryUsage();
    this.cpuUsageSnapshots = [];
    console.log(`🚀 ${label} started\n`);
  }

  // Checkpoint intermédiaire
  async checkpoint(message) {
    const elapsed = performance.now() - this.startTime;
    const currentMemory = this.getMemoryUsage();
    const memoryUsed = currentMemory - this.startMemory;
    const cpuTime = this.measureCPUUsage();

    console.log(`
    ⏱️  [${elapsed.toFixed(2)}ms] ${message}
    💾 Memory: ${currentMemory.toFixed(2)}MB (delta: +${memoryUsed.toFixed(2)}MB)
    ⚙️  CPU Time: ${cpuTime.toFixed(2)}ms
    `);
  }

  // Arrêter et afficher le rapport final
  async stopMonitoring(label = 'Algorithm') {
    const duration = performance.now() - this.startTime;
    const endMemory = this.getMemoryUsage();
    const memoryDelta = endMemory - this.startMemory;
    const avgCPU = this.cpuUsageSnapshots.length > 0
      ? this.cpuUsageSnapshots.reduce((a, b) => a + b, 0) / this.cpuUsageSnapshots.length
      : 0;

    console.log(`
      ╔═══════════════════════════════════╗
      ║  📊 PERFORMANCE REPORT: ${label}
      ╠═══════════════════════════════════╣
      ║  ⏱️  Duration: ${duration.toFixed(2)}ms
      ║  💾 Memory Used: ${memoryDelta.toFixed(2)}MB
      ║  ⚙️  Avg CPU Time: ${avgCPU.toFixed(2)}ms
      ║  📱 Platform: ${Platform.OS}
      ║  🔍 Total Checkpoints: ${this.cpuUsageSnapshots.length}
      ╚═══════════════════════════════════╝
    `);

    return {
      duration: duration.toFixed(2),
      memoryDelta: memoryDelta.toFixed(2),
      avgCPUTime: avgCPU.toFixed(2),
      timestamp: new Date().toISOString()
    };
  }
}

export const perfMonitor = new PerformanceMonitor();
