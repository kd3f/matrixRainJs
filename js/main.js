class Particle {
  constructor(x, y, speed, char, color, canvasHeight, charSize, effectType) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.char = char;
    this.color = color;
    this.canvasHeight = canvasHeight;
    this.remove = false;
    this.nextCharChange = this.calculateNextCharChange();
    this.charSize = charSize; // New: character size

    this.vx = 0; // Initial horizontal velocity
    this.vy = 0; // Initial vertical velocity
    this.unaffectedX = x; // New property to track the unaffected X position
    this.unaffectedY = y; // New property to track the unaffected Y position
    
    this.repulsionActive = false; // Track repulsion status

    if (effectType === 'ripple') this.update = this.updateRipple;
    if (effectType === 'repulsion') this.update = this.updateRepulsion;

  }

  calculateNextCharChange() {
    // Random interval between 100 and 500 frames
    return Math.floor(Math.random() * 40) + 10;
  }

  getRandomChar() {
    const charSetKeys = Object.keys(charSets); // Get all character set keys
    const randomKey = charSetKeys[Math.floor(Math.random() * charSetKeys.length)]; // Select a random key
    const charSet = charSets[randomKey]; // Access the selected character set
    return charSet[Math.floor(Math.random() * charSet.length)]; // Select a random char from the set
  }

/*
    // Ripple parameters
    const waveSpeed = 50; // Adjust for wave propagation speed
    const initialWaveAmplitude = 50; // Starting amplitude of the wave
    const frequency = 0.4; // Frequency of the wave
    const damping = 0.2; // Damping factor to gradually reduce the amplitude
*/

  updateRipple(systemTime, ripples, maxRippleRadius) {
    // Update unaffected position
    this.unaffectedY += this.speed;
  
    let totalDxDisplacement = 0;
    let totalDyDisplacement = 0;
  
    // Iterate over each ripple in the system
    ripples.forEach(ripple => {
      const elapsedTime = (systemTime - ripple.startTime) / 1000; // Convert to seconds
      const dx = this.unaffectedX - ripple.epicenter.x;
      const dy = this.unaffectedY - ripple.epicenter.y;
      const distanceFromEpicenter = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
  
      // Ripple effect parameters
      const waveSpeed = 50; // How fast the wave expands
      const initialWaveAmplitude = 50; // Initial amplitude of the wave
      const frequency = 0.4; // Frequency of the wave
      const damping = 0.05; // Damping factor for wave amplitude over distance
      const globalDampingDecayRate = 0.4; // Global damping factor to reduce effect over time
      const globalDamping = Math.exp(-globalDampingDecayRate * elapsedTime);
  
      // Dynamic radius control
      //const currentRippleRadius = elapsedTime * waveSpeed;
      //const rippleExpansionRate = 150; // Pixels per second
      const rippleExpansionRate = ripple.rippleExpansionRate;
      const currentRippleRadius = rippleExpansionRate * elapsedTime;
  
      // Ensure the particle is within the current ripple radius and does not exceed the maximum ripple radius
      if (distanceFromEpicenter <= currentRippleRadius && distanceFromEpicenter <= maxRippleRadius) {
        // Calculate wave amplitude with damping
        const distanceFactor = distanceFromEpicenter / waveSpeed;
        const timeFactor = elapsedTime - distanceFactor;
        const waveAmplitude = initialWaveAmplitude * Math.sin(timeFactor * Math.PI * frequency) * Math.exp(-damping * distanceFactor) * globalDamping;
  
        // Calculate displacement components based on angle to epicenter
        const dxDisplacement = waveAmplitude * Math.cos(angle);
        const dyDisplacement = waveAmplitude * Math.sin(angle);
  
        // Add displacements from this ripple to the total displacement
        totalDxDisplacement += dxDisplacement;
        totalDyDisplacement += dyDisplacement;
      }
    });
  
    // Apply total displacement from all ripples to the particle's position
    this.x = this.unaffectedX + totalDxDisplacement;
    this.y = this.unaffectedY + totalDyDisplacement;
  
    // Decrement the nextCharChange counter and update the char if it reaches 0
    this.nextCharChange -= 1;
    if (this.nextCharChange <= 0) {
      this.char = this.getRandomChar(); // Update the char from a randomly selected set
      this.nextCharChange = this.calculateNextCharChange(); // Reset the counter
    }
  
  
    // Update unaffected position as it would normally progress
    //this.unaffectedY += this.speed;
  
    // If the particle goes out of bounds, consider it for resetting
    if (this.unaffectedY > this.canvasHeight) {
      this.remove = true;
    }
    if (this.unaffectedX > this.canvasWidth || this.unaffectedX < this.charSize) {
      this.remove = true;
    }
    
    // Gradually move the particle back to its unaffected position
    if (!this.repulsionActive) {
      const deltaX = (this.unaffectedX - this.x) * 0.1;
      const deltaY = (this.unaffectedY - this.y) * 0.1;
      this.x += deltaX;
      this.y += deltaY;
  
      // Optionally, directly set the particle's position to the unaffected position
      // if the deltas are below a certain threshold to prevent endless micro-adjustments
      if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) {
        this.x = this.unaffectedX;
        this.y = this.unaffectedY;
      }
    }
  }

updateRepulsion(systemTime, rippleActive, rippleStartTime, rippleEpicenter) {
  console.log('updateRepulsion');
    // Decrement the nextCharChange counter and update the char if it reaches 0
    this.nextCharChange -= 1;
    if (this.nextCharChange <= 0) {
      this.char = this.getRandomChar(); // Update the char from a randomly selected set
      this.nextCharChange = this.calculateNextCharChange(); // Reset the counter
    }


  // Update unaffected position as it would normally progress
  this.unaffectedY += this.speed;

  // If the particle goes out of bounds, consider it for resetting
  if (this.unaffectedY > this.canvasHeight) {
    this.remove = true;
  }

   // Apply repulsion effects (if active)
if (this.repulsionActive) {
  let k = 0.1; // Spring constant
  let dampingFactor = 0.9; // Damping factor
    // Existing code to update position based on velocity
    this.x += this.vx;
    this.y += this.vy;

    // Calculate spring force based on displacement from original position
    let springForceX = -(this.x - this.unaffectedX) * k; // `k` is your spring constant
    let springForceY = -(this.y - this.unaffectedY) * k;

    // Update velocity to include spring force
    this.vx += springForceX;
    this.vy += springForceY;

    // Apply damping
    this.vx *= dampingFactor; // `dampingFactor` should be slightly less than 1
    this.vy *= dampingFactor;

    // Existing code to stop repulsion effect
    if (Math.abs(this.vx) < 0.01 && Math.abs(this.vy) < 0.01) {
        this.vx = 0;
        this.vy = 0;
        this.repulsionActive = false;
    }
}


  // Gradually move the particle back to its unaffected position
  if (!this.repulsionActive) {
    const deltaX = (this.unaffectedX - this.x) * 0.1;
    const deltaY = (this.unaffectedY - this.y) * 0.1;
    this.x += deltaX;
    this.y += deltaY;

    // Optionally, directly set the particle's position to the unaffected position
    // if the deltas are below a certain threshold to prevent endless micro-adjustments
    if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) {
      this.x = this.unaffectedX;
      this.y = this.unaffectedY;
    }
  }
}

  draw(ctx) {
    ctx.fillStyle = this.color;
    //ctx.font = `${this.charSize}px monospace`; // Set font size based on charSize
    // Set the font with the size and family
    ctx.font = `${this.charSize}px 'Noto Sans JP', monospace`; // Include a fallback font
    ctx.fillText(this.char, this.x, this.y);
  }
}


class ParticleSystem {
  constructor(canvas, charSize) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.charSize = charSize;
    this.particles = [];
    this.columns = Math.floor(this.canvas.width / charSize);
    this.canvasHeight = canvas.height;
    this.columnStates = Array(this.columns).fill().map(() => ({
      active: false,
      lastRestart: 0,
      initialSpeed: 2 + Math.random() * 3, // Default speed for foreground
      trailLength: 40 + Math.floor(Math.random() * (15)), // Default trail length
      particles: [],
      /*isBackground: Math.random() > 0.8, // 20% chance to be a background column
      // Adjust speed, size, and trail length for background columns
      ...Math.random() > 0.2 ? {
        initialSpeed: 1 + Math.random() * 3, // Slower for depth
        trailLength: 10 + Math.floor(Math.random() * (195 - 10)), // longer trail for depth
        charSize: charSize * 0.8, // Smaller characters for depth
      } : {},*/
    }));

    this.effectType = 'ripple'; // 'ripple' || 'repulsion'

    // Matrix Riple Effect
    this.rippleActive = false;
    this.rippleStartTime = 0;
    this.rippleEpicenter = { x: 0, y: 0 };
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    this.maxRippleRadius = Math.sqrt(Math.pow(canvasWidth, 2) + Math.pow(canvasHeight, 2)) / 2;
    this.ripples = []; // An array to store multiple ripples


    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.onCanvasClick(x, y);
    });

    this.initializeParticles();
  }

  onCanvasClick(clickX, clickY) {
      if (this.effectType === 'repulsion') { 
          this.onCanvasRepulsionClick(clickX, clickY);
        }
      if (this.effectType === 'ripple') { 
          this.onCanvasRippleClick(clickX, clickY);
        }
  }

  // Matrix Ripple effect
  onCanvasRippleClick(clickX, clickY) {
    const rippleExpansionRate = 150; // Pixels per second
      const newRipple = {
          epicenter: { x: clickX, y: clickY },
          startTime: performance.now(),
          rippleExpansionRate: rippleExpansionRate
      };
      this.ripples.push(newRipple); // Add the new ripple to the list
  }

  // Elastic repulsion effect
  onCanvasRepulsionClick(clickX, clickY) {
    console.log('onCanvasRepulsionClick');
    const repulsionRadius = 150; // Pixels within which particles will be affected
    const repulsionStrength = 25; // Adjust based on desired effect strength
  
    this.columnStates.forEach((columnState, columnIndex) => {      
        // Update particles within each column
  
        columnState.particles.forEach(particle => {
          
          const dx = particle.x - clickX;
          const dy = particle.y - clickY;
          const distance = Math.sqrt(dx * dx + dy * dy);
  
          if (distance < repulsionRadius) {
            const repulsionForce = (1 - (distance / repulsionRadius)) * repulsionStrength;
            // Apply a repulsion effect in both x and y directions
            particle.vx = (dx / distance) * repulsionForce;
            particle.vy = (dy / distance) * repulsionForce; // New: apply vertical repulsion
            particle.repulsionActive = true;
          }
  
        });
  
      });
  
  }

  initializeParticles() {
    for (let i = 0; i < this.columns; i++) {
      // Delay the start of each column to stagger the rain effect
      setTimeout(() => {
        this.restartColumn(i);
      }, Math.random() * 150); // Random start delay up to 0.15 seconds
    }
  }

  //todo :: avoid duplicated method in particle
  getRandomChar() {
    const charSetKeys = Object.keys(charSets); // Get all character set keys
    const randomKey = charSetKeys[Math.floor(Math.random() * charSetKeys.length)]; // Select a random key
    const charSet = charSets[randomKey]; // Access the selected character set
    return charSet[Math.floor(Math.random() * charSet.length)]; // Select a random char from the set
  }

  restartColumn(columnIndex) {
    const columnState = this.columnStates[columnIndex];
    const x = columnIndex * this.charSize;
    //const speed = columnState.initialSpeed;
    const trailLength = columnState.trailLength;
    const initialY = -trailLength * this.charSize;

    let isBackground = columnState.isBackground;
    let speed = isBackground ? columnState.initialSpeed * 0.5 : columnState.initialSpeed;
    let charSize = isBackground ? this.charSize * 0.8 : this.charSize; // Adjust size for background
    //let opacity = isBackground ? 0.5 : 1; // Adjust opacity for background

    // Clear existing particles for the column
    columnState.particles = [];

    // Directly create and add new particles to the column's particle array
    let charSetKey = this.getRandomCharSet();
    for (let i = 0; i <= trailLength; i++) {
      let char = this.getRandomChar(charSets[charSetKey]);
      let opacity = i === 0 ? 1.0 : Math.max((trailLength - i) / trailLength, 0.1);
      let color = i === 0 ? 'rgba(255, 255, 255, 1.0)' : `rgba(0, 255, 0, ${opacity})`;
      //columnState.particles.push(new Particle(x, initialY - i * this.charSize, speed, char, color, this.canvasHeight, this.charSize, this.effectType));
      columnState.particles.push(new Particle(x, initialY - i * charSize, speed, char, color, this.canvasHeight, charSize, this.effectType));
    }

    // Update column state
    this.columnStates[columnIndex] = { ...columnState, active: true, lastRestart: Date.now() };
  }

  // Utility function to select a random character set
  getRandomCharSet() {
    const charSetKeys = Object.keys(charSets);
    const randomKey = charSetKeys[Math.floor(Math.random() * charSetKeys.length)];
    return randomKey;
  }

  update(timestamp) {
    // Cleanup logic test method
    this.ripples = this.ripples.filter(ripple => {
        const elapsedTime = (performance.now() - ripple.startTime) / 1000;
        return elapsedTime * ripple.rippleExpansionRate <= this.maxRippleRadius;
    });

    // Iterate over columns instead of individual particles
    this.columnStates.forEach((columnState, columnIndex) => {      
      // Update particles within each column
      columnState.particles = columnState.particles.filter(particle => !particle.remove);
      columnState.particles.forEach(particle => {
        particle.update(timestamp, this.ripples, this.maxRippleRadius);
      });

      // Check if the column is ready to restart based on its particles
      if (columnState.active && columnState.particles.length === 0) {
        const currentTime = Date.now();
        const delaySinceLastRestart = currentTime - columnState.lastRestart;
        const restartDelay = this.calculateRestartDelay(columnState);

        if (delaySinceLastRestart > restartDelay) {
          this.restartColumn(columnIndex);
          columnState.active = false;
          columnState.lastRestart = currentTime;
        }
      }
    });
  }

calculateRestartDelay(columnState) {
  const baseDelay = 25; // Base delay ensures there's always some pause
  const trailLengthDelay = columnState.trailLength * 20; // Adjusted multiplier for trail length
  const speedDelay = 10 / columnState.initialSpeed; // Delay based on speed

  // Calculate total delay
  const totalDelay = 5; //baseDelay + trailLengthDelay + speedDelay;
  return totalDelay;
}


  // Draw particles on canvas
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas for next draw

    this.columnStates.forEach((columnState, columnIndex) => {      

      columnState.particles.forEach(particle => {
        particle.draw(this.ctx);
      });

    });

  }

  // Main animation loop to update and draw particles
  animate(timestamp) {
    requestAnimationFrame(this.animate.bind(this)); // Ensure this method's context is preserved
    this.update(timestamp);
    this.draw();
  }
}

// Define character sets
const charSets = {
  //latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  katakana: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ', 
  special: '@#?!',
};

// Extend getRandomChar to include a method for initializing and updating particles.
function getRandomChar(charSet) {
  return charSet[Math.floor(Math.random() * charSet.length)];
}



document.addEventListener('DOMContentLoaded', function() {

const canvas = document.getElementById('matrixRain'); // Ensure you have a canvas element with this ID in your HTML
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const charSize = 22; // Adjust based on desired appearance

const matrixRain = new ParticleSystem(canvas, charSize);
matrixRain.animate();

// end of document ready    
});