// --- SKILLS SECTION ANIMATED GRAPHICS ---

function initSkillsAnimation() {
    const canvas = document.getElementById('skills-bg-canvas');
    if (!canvas) return;

    // Create SVG-based animated background with floating tech symbols
    canvas.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="skillGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00f2fe;stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:#9d4edd;stop-opacity:0.1" />
        </linearGradient>
        <linearGradient id="skillGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#9d4edd;stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:0.1" />
        </linearGradient>
        <filter id="skillGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Floating circles with pulse animation -->
      <circle cx="100" cy="150" r="40" fill="url(#skillGradient1)" opacity="0.3" class="float-circle" style="animation: floatSkill 6s ease-in-out infinite; animation-delay: 0s;"/>
      <circle cx="850" cy="200" r="35" fill="url(#skillGradient2)" opacity="0.2" class="float-circle" style="animation: floatSkill 8s ease-in-out infinite; animation-delay: 1s;"/>
      <circle cx="150" cy="450" r="30" fill="url(#skillGradient1)" opacity="0.25" class="float-circle" style="animation: floatSkill 7s ease-in-out infinite; animation-delay: 2s;"/>
      <circle cx="900" cy="400" r="45" fill="url(#skillGradient2)" opacity="0.15" class="float-circle" style="animation: floatSkill 9s ease-in-out infinite; animation-delay: 1.5s;"/>
      <circle cx="500" cy="100" r="50" fill="url(#skillGradient1)" opacity="0.2" class="float-circle" style="animation: floatSkill 10s ease-in-out infinite; animation-delay: 0.5s;"/>
      
      <!-- Animated grid lines -->
      <g stroke="rgba(0, 242, 254, 0.1)" stroke-width="1" opacity="0.3">
        <line x1="200" y1="0" x2="200" y2="600" class="pulse-line" style="animation: pulseLine 4s ease-in-out infinite;"/>
        <line x1="400" y1="0" x2="400" y2="600" class="pulse-line" style="animation: pulseLine 4s ease-in-out infinite; animation-delay: 0.5s;"/>
        <line x1="600" y1="0" x2="600" y2="600" class="pulse-line" style="animation: pulseLine 4s ease-in-out infinite; animation-delay: 1s;"/>
        <line x1="800" y1="0" x2="800" y2="600" class="pulse-line" style="animation: pulseLine 4s ease-in-out infinite; animation-delay: 0.25s;"/>
        
        <line x1="0" y1="150" x2="1000" y2="150" class="pulse-line-h" style="animation: pulseLineH 5s ease-in-out infinite;"/>
        <line x1="0" y1="300" x2="1000" y2="300" class="pulse-line-h" style="animation: pulseLineH 5s ease-in-out infinite; animation-delay: 0.5s;"/>
        <line x1="0" y1="450" x2="1000" y2="450" class="pulse-line-h" style="animation: pulseLineH 5s ease-in-out infinite; animation-delay: 1s;"/>
      </g>

      <!-- Tech symbols (corners) -->
      <g opacity="0.15" filter="url(#skillGlow)">
        <!-- Top-left: Terminal -->
        <rect x="30" y="30" width="60" height="50" rx="8" fill="none" stroke="#00f2fe" stroke-width="2" class="tech-symbol" style="animation: rotate3d 8s linear infinite;"/>
        <line x1="40" y1="55" x2="80" y2="55" stroke="#00f2fe" stroke-width="1"/>
        <line x1="40" y1="65" x2="75" y2="65" stroke="#00f2fe" stroke-width="1"/>
        
        <!-- Top-right: Database -->
        <ellipse cx="950" cy="50" rx="25" ry="15" fill="none" stroke="#9d4edd" stroke-width="2" class="tech-symbol" style="animation: rotate3d 10s linear infinite; animation-direction: reverse;"/>
        <line x1="925" y1="50" x2="975" y2="50" stroke="#9d4edd" stroke-width="1"/>
        <ellipse cx="950" cy="70" rx="25" ry="15" fill="none" stroke="#9d4edd" stroke-width="2"/>
        
        <!-- Bottom-left: Code -->
        <polyline points="40,520 60,540 40,560" fill="none" stroke="#00f2fe" stroke-width="2" class="tech-symbol" style="animation: pulse 2s ease-in-out infinite;"/>
        <polyline points="80,520 60,540 80,560" fill="none" stroke="#00f2fe" stroke-width="2" style="animation: pulse 2s ease-in-out infinite; animation-delay: 0.3s;"/>
        
        <!-- Bottom-right: Gears -->
        <circle cx="940" cy="540" r="20" fill="none" stroke="#9d4edd" stroke-width="2" class="tech-symbol" style="animation: rotate 4s linear infinite;"/>
        <circle cx="970" cy="560" r="15" fill="none" stroke="#9d4edd" stroke-width="2" style="animation: rotate 4s linear infinite; animation-direction: reverse;"/>
      </g>
    </svg>
  `;

    // Add CSS animations for SVG
    const style = document.createElement('style');
    style.textContent = `
    .tech-symbol, .float-circle {
      transform-box: fill-box;
      transform-origin: center;
    }

    @keyframes floatSkill {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-30px); }
    }
    
    @keyframes pulseLine {
      0%, 100% { stroke-opacity: 0.2; }
      50% { stroke-opacity: 0.6; }
    }
    
    @keyframes pulseLineH {
      0%, 100% { stroke-opacity: 0.15; }
      50% { stroke-opacity: 0.5; }
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes rotate3d {
      from { transform: rotateZ(0deg); }
      to { transform: rotateZ(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }
  `;
    document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkillsAnimation);
} else {
    initSkillsAnimation();
}
