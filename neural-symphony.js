const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let nodes = [];
let connections = [];
let dataPulses = [];
let backgroundParticles = [];
let audioContext, analyser, dataArray;
let autoMode = false;
let networkSize = 150;
let flowSpeed = 3;
let activationRate = 0.4;
let visualIntensity = 1;
let frequencyData = [];
let dominantFrequency = 0;
let audioLevel = 0;
let frequencyHistory = [];
let time = 0;

let networkOutput = {
    frequency: 0,
    amplitude: 0,
    classification: 'silence',
    predictedFrequency: 0,
    predictedClassification: '...',
    networkActivation: 0,
    networkConfidence: 0,
    activeNodesCount: 0,
    audioSource: '',
};

function initBackgroundParticles() {
    const particleContainer = document.getElementById('bgParticles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particleContainer.appendChild(particle);
    }
}

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

class Node {
    constructor(x, y, layer) {
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.originalY = y;
        this.layer = layer;
        this.activation = 0;
        this.targetActivation = 0;
        this.radius = Math.random() * 4 + 3;
        this.forwardConnections = [];
        this.backwardConnections = [];
        this.lateralConnections = [];
        this.pulseTime = 0;
        this.lastActivation = 0;
        this.hue = 120 + (layer * 60) + Math.random() * 40;
        this.breathePhase = Math.random() * Math.PI * 2;
        this.energy = 0;
        this.maxEnergy = 1;
    }

    update() {
        this.lastActivation = this.activation;
        this.activation += (this.targetActivation - this.activation) * 0.15;
        this.targetActivation *= 0.92;
        
        if (this.pulseTime > 0) {
            this.pulseTime -= 0.03;
        }
        
        const breathe = Math.sin(time * 0.02 + this.breathePhase) * 0.1;
        this.x = this.originalX + breathe * 10;
        this.y = this.originalY + breathe * 5;
        
        this.energy *= 0.98;
    }

    draw() {
        const intensity = Math.max(this.activation, this.pulseTime, this.energy * 0.5);
        const alpha = 0.4 + intensity * 0.6;
        const size = this.radius * (1 + intensity * 0.8) * visualIntensity;
        
        for (let i = 3; i >= 1; i--) {
            ctx.beginPath();
            const glowSize = size * (i * 1.5);
            const glowAlpha = alpha / (i * 2);
            
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, glowSize
            );
            
            gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${glowAlpha})`);
            gradient.addColorStop(0.5, `hsla(${this.hue + 20}, 70%, 50%, ${glowAlpha * 0.5})`);
            gradient.addColorStop(1, `hsla(${this.hue + 40}, 60%, 40%, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.beginPath();
        ctx.fillStyle = `hsla(${this.hue}, 90%, 70%, ${alpha})`;
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = `hsla(${this.hue + 60}, 100%, 80%, ${alpha * 0.8})`;
        ctx.arc(this.x - size * 0.3, this.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        if (intensity > 0.7) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${this.hue}, 100%, 80%, ${(intensity - 0.7) * 2})`;
            ctx.lineWidth = 2 * visualIntensity;
            ctx.arc(this.x, this.y, size * (1.5 + Math.sin(time * 0.1) * 0.2), 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    activate(intensity = 1) {
        this.targetActivation = Math.min(1, this.targetActivation + intensity);
        this.pulseTime = 1;
        this.energy = Math.min(this.maxEnergy, this.energy + intensity * 0.5);
    }
}

class Connection {
    constructor(from, to, type = 'forward') {
        this.from = from;
        this.to = to;
        this.type = type;
        this.weight = Math.random() * 0.6 + 0.4;
        this.activity = 0;
        this.maxActivity = 1;
        this.baseAlpha = 0.1;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    draw() {
        const distance = Math.sqrt(
            (this.to.x - this.from.x) ** 2 + (this.to.y - this.from.y) ** 2
        );
        const normalizedDistance = Math.min(1, distance / 200);
        
        const alpha = this.baseAlpha + this.activity * 0.6 * visualIntensity;
        const width = (1 + this.activity * 3) * visualIntensity;
        
        const pulse = Math.sin(time * 0.05 + this.pulsePhase) * 0.1 + 0.9;
        
        ctx.beginPath();
        ctx.lineWidth = width * pulse;
        
        if (this.type === 'backward') {
            ctx.strokeStyle = `rgba(255, 100, 150, ${alpha})`;
            ctx.shadowColor = 'rgba(255, 100, 150, 0.5)';
        } else if (this.type === 'lateral') {
            ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
            ctx.shadowColor = 'rgba(100, 200, 255, 0.5)';
        } else {
            ctx.strokeStyle = `rgba(0, 255, 150, ${alpha})`;
            ctx.shadowColor = 'rgba(0, 255, 150, 0.5)';
        }
        
        ctx.shadowBlur = this.activity * 10 * visualIntensity;
        
        const midX = (this.from.x + this.to.x) / 2;
        const midY = (this.from.y + this.to.y) / 2;
        const curvature = (Math.random() - 0.5) * 50;
        
        ctx.moveTo(this.from.x, this.from.y);
        ctx.quadraticCurveTo(midX + curvature, midY + curvature, this.to.x, this.to.y);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }

    update() {
        this.activity *= 0.85;
    }
}

class DataPulse {
    constructor(connection, intensity = null) {
        this.connection = connection;
        this.progress = 0;
        this.speed = flowSpeed * (0.008 + Math.random() * 0.012);
        this.intensity = intensity || Math.random() * 0.9 + 0.1;
        this.size = Math.random() * 4 + 3;
        this.type = connection.type;
        this.history = [];
        this.trailLength = 8;
        this.hue = this.type === 'backward' ? 320 : 
                  this.type === 'lateral' ? 200 : 120;
        this.sparkles = [];
        
        for (let i = 0; i < 3; i++) {
            this.sparkles.push({
                offset: Math.random() * Math.PI * 2,
                distance: Math.random() * 15 + 5,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    update() {
        const midX = (this.connection.from.x + this.connection.to.x) / 2;
        const midY = (this.connection.from.y + this.connection.to.y) / 2;
        const curvature = 25;
        
        const t = this.progress;
        const currentX = (1 - t) * (1 - t) * this.connection.from.x + 
                         2 * (1 - t) * t * (midX + curvature) + 
                         t * t * this.connection.to.x;
        const currentY = (1 - t) * (1 - t) * this.connection.from.y + 
                         2 * (1 - t) * t * (midY + curvature) + 
                         t * t * this.connection.to.y;

        this.history.push({ x: currentX, y: currentY, intensity: this.intensity });
        if (this.history.length > this.trailLength) {
            this.history.shift();
        }

        this.progress += this.speed;

        if (this.progress >= 1) {
            this.connection.to.activate(this.intensity * this.connection.weight);
            this.propagate();
            return false;
        }

        this.connection.activity = Math.max(this.connection.activity, this.intensity);
        return true;
    }

    propagate() {
        const sourceNode = this.connection.to;
        
        if (this.type === 'forward' && sourceNode.layer < 3) {
            sourceNode.forwardConnections.forEach((conn) => {
                const prob = sourceNode.layer === 0 ? 0.95 : 
                           sourceNode.layer === 1 ? 0.8 : 0.6;
                if (Math.random() < activationRate * prob) {
                    dataPulses.push(new DataPulse(conn, this.intensity * 0.85));
                }
            });
        }

        if ((this.type === 'forward' || this.type === 'lateral') && 
            sourceNode.layer >= 2 && Math.random() < activationRate * 0.25) {
            sourceNode.backwardConnections.forEach((conn) => {
                if (Math.random() < 0.5) {
                    dataPulses.push(new DataPulse(conn, this.intensity * 0.7));
                }
            });
        }

        if (Math.random() < activationRate * 0.3 && sourceNode.lateralConnections.length > 0) {
            sourceNode.lateralConnections.forEach((conn) => {
                if (Math.random() < 0.6) {
                    dataPulses.push(new DataPulse(conn, this.intensity * 0.6));
                }
            });
        }
    }

    draw() {
        const t = this.progress;
        const midX = (this.connection.from.x + this.connection.to.x) / 2;
        const midY = (this.connection.from.y + this.connection.to.y) / 2;
        const curvature = 25;
        
        const x = (1 - t) * (1 - t) * this.connection.from.x + 
                 2 * (1 - t) * t * (midX + curvature) + 
                 t * t * this.connection.to.x;
        const y = (1 - t) * (1 - t) * this.connection.from.y + 
                 2 * (1 - t) * t * (midY + curvature) + 
                 t * t * this.connection.to.y;

        for (let i = 0; i < this.history.length; i++) {
            const trailPoint = this.history[i];
            const trailAlpha = (i / this.trailLength) * this.intensity * 0.6 * visualIntensity;
            const trailSize = (i / this.trailLength) * this.size * 0.8;

            ctx.beginPath();
            const gradient = ctx.createRadialGradient(
                trailPoint.x, trailPoint.y, 0,
                trailPoint.x, trailPoint.y, trailSize * 2
            );
            gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${trailAlpha})`);
            gradient.addColorStop(1, `hsla(${this.hue}, 80%, 60%, 0)`);
            ctx.fillStyle = gradient;
            ctx.arc(trailPoint.x, trailPoint.y, trailSize * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        this.sparkles.forEach((sparkle, index) => {
            const sparkleX = x + Math.cos(time * 0.1 + sparkle.phase + sparkle.offset) * sparkle.distance;
            const sparkleY = y + Math.sin(time * 0.1 + sparkle.phase + sparkle.offset) * sparkle.distance;
            
            ctx.beginPath();
            ctx.fillStyle = `hsla(${this.hue + 60}, 100%, 80%, ${this.intensity * 0.6 * visualIntensity})`;
            ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        for (let i = 3; i >= 1; i--) {
            ctx.beginPath();
            const pulseSize = this.size * i * 0.8 * visualIntensity;
            const pulseAlpha = this.intensity / i;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize);
            gradient.addColorStop(0, `hsla(${this.hue}, 90%, 70%, ${pulseAlpha})`);
            gradient.addColorStop(0.7, `hsla(${this.hue + 30}, 80%, 60%, ${pulseAlpha * 0.5})`);
            gradient.addColorStop(1, `hsla(${this.hue + 60}, 70%, 50%, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `hsla(${this.hue + 60}, 100%, 90%, ${this.intensity * visualIntensity})`;
        ctx.arc(x, y, this.size * visualIntensity, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initNetwork() {
    nodes = [];
    connections = [];
    dataPulses = [];

    const layers = 4;
    const totalNodes = networkSize;
    
    const nodesPerLayer = [
        Math.floor(totalNodes * 0.2),
        Math.floor(totalNodes * 0.35),
        Math.floor(totalNodes * 0.3),
        Math.floor(totalNodes * 0.15),
    ];

    for (let layer = 0; layer < layers; layer++) {
        const layerNodesCount = nodesPerLayer[layer];
        const layerX = (width / (layers + 1)) * (layer + 1);
        
        for (let i = 0; i < layerNodesCount; i++) {
            const angle = (i / layerNodesCount) * Math.PI * 2;
            const radius = Math.min(width, height) * 0.1 + Math.random() * 50;
            const centerY = height / 2;
            
            const x = layerX + Math.cos(angle) * (radius * 0.3) + (Math.random() - 0.5) * 100;
            const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100;
            
            nodes.push(new Node(x, y, layer));
        }
    }

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        const nextLayerNodes = nodes.filter((n) => n.layer === node.layer + 1);
        nextLayerNodes.forEach((nextNode) => {
            const distance = Math.sqrt(
                (node.x - nextNode.x) ** 2 + (node.y - nextNode.y) ** 2
            );
            const maxDist = Math.max(width, height) / layers;
            const probByDistance = 1 - Math.min(1, distance / maxDist);
            
            if (Math.random() < 0.7 + probByDistance * 0.2) {
                const connection = new Connection(node, nextNode, 'forward');
                connections.push(connection);
                node.forwardConnections.push(connection);
            }
        });

        const prevLayerNodes = nodes.filter((n) => n.layer === node.layer - 1);
        prevLayerNodes.forEach((prevNode) => {
            if (Math.random() < 0.2) {
                const connection = new Connection(node, prevNode, 'backward');
                connections.push(connection);
                node.backwardConnections.push(connection);
            }
        });

        const sameLayerNodes = nodes.filter((n) => n.layer === node.layer && n !== node);
        sameLayerNodes.forEach((sameNode) => {
            if (Math.random() < 0.08) {
                const connection = new Connection(node, sameNode, 'lateral');
                connections.push(connection);
                node.lateralConnections.push(connection);
            }
        });
    }
}

function animate() {
    time++;
    
    const gradient = ctx.createRadialGradient(
        width/2, height/2, 0,
        width/2, height/2, Math.max(width, height)
    );
    gradient.addColorStop(0, `rgba(5, 5, 15, ${0.95 - Math.sin(time * 0.01) * 0.05})`);
    gradient.addColorStop(0.5, `rgba(0, 5, 10, ${0.98 - Math.sin(time * 0.008) * 0.02})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    connections.forEach((conn) => {
        conn.update();
        conn.draw();
    });

    nodes.forEach((node) => {
        node.update();
        node.draw();
    });

    dataPulses = dataPulses.filter((pulse) => {
        const alive = pulse.update();
        if (alive) pulse.draw();
        return alive;
    });

    if (analyser) {
        processAudioData();
    }

    if (autoMode) {
        if (Math.random() < 0.04) {
            if (Math.random() < 0.8) {
                triggerRandomPulse();
            } else {
                triggerRandomPulseFromOutput();
            }
        }
        
        if (Math.random() < 0.002) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => triggerRandomPulse(Math.random() * 0.8 + 0.2), i * 100);
            }
        }
    }

    updateNetworkOutput();
    updateStatusDisplay();
    requestAnimationFrame(animate);
}

function processAudioData() {
    analyser.getByteFrequencyData(dataArray);
    
    let maxAmplitude = 0;
    let maxIndex = 0;
    let totalAmplitude = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
        totalAmplitude += dataArray[i];
        if (dataArray[i] > maxAmplitude) {
            maxAmplitude = dataArray[i];
            maxIndex = i;
        }
    }
    
    audioLevel = totalAmplitude / dataArray.length;
    dominantFrequency = (maxIndex * audioContext.sampleRate) / (2 * analyser.fftSize);
    frequencyData = Array.from(dataArray);
    
    frequencyHistory.push(dominantFrequency);
    if (frequencyHistory.length > 60) {
        frequencyHistory.shift();
    }
    
    classifySound();
    triggerFrequencyBasedActivation();
}

function classifySound() {
    if (audioLevel < 15) {
        networkOutput.classification = 'silence';
    } else if (dominantFrequency < 250) {
        networkOutput.classification = 'bass/drums';
    } else if (dominantFrequency < 500) {
        networkOutput.classification = 'low voice';
    } else if (dominantFrequency < 1000) {
        networkOutput.classification = 'mid voice';
    } else if (dominantFrequency < 2000) {
        networkOutput.classification = 'high voice';
    } else if (dominantFrequency < 4000) {
        networkOutput.classification = 'treble';
    } else {
        networkOutput.classification = 'high freq';
    }
}

function updateNetworkOutput() {
    networkOutput.frequency = Math.round(dominantFrequency);
    networkOutput.amplitude = Math.round(audioLevel);
    
    const outputNodes = nodes.filter((n) => n.layer === 3);
    if (outputNodes.length > 0) {
        const avgActivation = outputNodes.reduce((sum, node) => sum + node.activation, 0) / outputNodes.length;
        networkOutput.networkActivation = avgActivation;
        
        let maxOutputActivation = 0;
        let predictedFreq = 0;
        let predictedClass = '...';
        let totalOutputActivation = 0;
        
        const outputMapping = [
            { freq: 150, class: 'bass/drums' },
            { freq: 400, class: 'low voice' },
            { freq: 800, class: 'mid voice' },
            { freq: 1500, class: 'high voice' },
            { freq: 3000, class: 'treble' },
            { freq: 6000, class: 'high freq' },
        ];
        
        outputNodes.forEach((node, index) => {
            if (node.activation > maxOutputActivation) {
                maxOutputActivation = node.activation;
                if (outputMapping[index]) {
                    predictedFreq = outputMapping[index].freq;
                    predictedClass = outputMapping[index].class;
                } else {
                    predictedFreq = (index / outputNodes.length) * 8000 + Math.random() * 200;
                    predictedClass = `Class ${index}`;
                }
            }
            totalOutputActivation += node.activation;
        });
        
        networkOutput.predictedFrequency = Math.round(predictedFreq);
        networkOutput.predictedClassification = predictedClass;
        networkOutput.networkConfidence = totalOutputActivation > 0 ? 
            (maxOutputActivation / totalOutputActivation) : 0;
    }
    
    networkOutput.activeNodesCount = nodes.filter((node) => node.activation > 0.1).length;
}

function triggerFrequencyBasedActivation() {
    if (audioLevel < 15) return;
    
    const inputNodes = nodes.filter((n) => n.layer === 0);
    if (inputNodes.length === 0) return;
    
    const bandWidth = analyser.frequencyBinCount / inputNodes.length;
    
    for (let i = 0; i < inputNodes.length; i++) {
        const startBin = Math.floor(i * bandWidth);
        const endBin = Math.min(Math.floor((i + 1) * bandWidth), analyser.frequencyBinCount);
        
        let bandAmplitude = 0;
        for (let j = startBin; j < endBin; j++) {
            bandAmplitude += dataArray[j];
        }
        bandAmplitude /= (endBin - startBin);
        
        if (bandAmplitude > 25) {
            const intensity = Math.min(1, bandAmplitude / 255);
            inputNodes[i].activate(intensity);
            
            inputNodes[i].forwardConnections.forEach((conn) => {
                if (Math.random() < 0.95) {
                    dataPulses.push(new DataPulse(conn, intensity));
                }
            });
        }
    }
}

function triggerRandomPulse(intensity = Math.random()) {
    const inputNodes = nodes.filter((n) => n.layer === 0);
    if (inputNodes.length > 0) {
        const randomNode = inputNodes[Math.floor(Math.random() * inputNodes.length)];
        randomNode.activate(intensity);
        randomNode.forwardConnections.forEach((conn) => {
            if (Math.random() < 0.85) {
                dataPulses.push(new DataPulse(conn, intensity));
            }
        });
    }
}

function triggerRandomPulseFromOutput(intensity = Math.random()) {
    const outputNodes = nodes.filter((n) => n.layer === 3);
    if (outputNodes.length > 0) {
        const randomNode = outputNodes[Math.floor(Math.random() * outputNodes.length)];
        randomNode.activate(intensity);
        randomNode.backwardConnections.forEach((conn) => {
            if (Math.random() < 0.7) {
                dataPulses.push(new DataPulse(conn, intensity));
            }
        });
    }
}

async function startAudioVisualization() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
            video: false,
        });
        
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        
        networkOutput.audioSource = 'desktop';
        document.getElementById('audioBtn').classList.add('active');
        document.getElementById('currentMode').textContent = '🎵 Audio Mode';
        
        if (autoMode) {
            toggleAutoMode();
        }
    } catch (err) {
        console.error('Error accessing system audio:', err);
        alert('Could not access system audio. Using auto mode instead.');
        if (!autoMode) {
            toggleAutoMode();
        }
    }
}

function toggleAutoMode() {
    autoMode = !autoMode;
    const autoBtn = document.getElementById('autoBtn');
    const currentModeEl = document.getElementById('currentMode');
    
    if (autoMode) {
        autoBtn.textContent = '⏸️ Stop Auto';
        autoBtn.classList.add('active');
        currentModeEl.textContent = '🤖 Auto Mode';
        networkOutput.audioSource = 'auto';
    } else {
        autoBtn.textContent = '🤖 Auto Mode';
        autoBtn.classList.remove('active');
        currentModeEl.textContent = '⏸️ Paused';
    }
    
    if (autoMode && audioContext) {
        audioContext.close();
        audioContext = null;
        analyser = null;
        document.getElementById('audioBtn').classList.remove('active');
    }
}

function resetNetwork() {
    initNetwork();
    dataPulses = [];
}

function updateNetworkSize() {
    networkSize = parseInt(document.getElementById('networkSize').value);
    document.getElementById('networkSizeValue').textContent = networkSize + ' Nodes';
    resetNetwork();
}

function updateFlowSpeed() {
    flowSpeed = parseFloat(document.getElementById('flowSpeed').value);
    document.getElementById('flowSpeedValue').textContent = flowSpeed.toFixed(1) + 'x';
}

function updateActivationRate() {
    activationRate = parseFloat(document.getElementById('activationRate').value);
    document.getElementById('activationRateValue').textContent = Math.round(activationRate * 100) + '%';
}

function updateVisualIntensity() {
    visualIntensity = parseFloat(document.getElementById('visualIntensity').value);
    document.getElementById('visualIntensityValue').textContent = Math.round(visualIntensity * 100) + '%';
}

function updateStatusDisplay() {
    document.getElementById('activeNodes').textContent = networkOutput.activeNodesCount;
    document.getElementById('activePulses').textContent = dataPulses.length;
    document.getElementById('networkActivity').textContent = Math.round(networkOutput.networkActivation * 100) + '%';
    document.getElementById('dominantFreq').textContent = networkOutput.frequency + ' Hz';
    document.getElementById('audioLevel').textContent = networkOutput.amplitude;
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let nearestNode = null;
    let minDistance = Infinity;
    
    nodes.forEach((node) => {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance < minDistance) {
            minDistance = distance;
            nearestNode = node;
        }
    });
    
    if (nearestNode && minDistance < 50) {
        nearestNode.activate(1);
        
        nearestNode.forwardConnections.forEach((conn) => {
            dataPulses.push(new DataPulse(conn, 1));
        });
        nearestNode.backwardConnections.forEach((conn) => {
            if (Math.random() < 0.6) {
                dataPulses.push(new DataPulse(conn, 0.8));
            }
        });
        nearestNode.lateralConnections.forEach((conn) => {
            if (Math.random() < 0.6) {
                dataPulses.push(new DataPulse(conn, 0.6));
            }
        });
    } else {
        const nearbyNodes = nodes.filter(node => {
            const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            return distance < 100;
        });
        
        nearbyNodes.forEach(node => {
            const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
            const intensity = 1 - (distance / 100);
            setTimeout(() => {
                node.activate(intensity);
            }, distance * 2);
        });
    }
});

function init() {
    initBackgroundParticles();
    resizeCanvas();
    initNetwork();
    
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        animate();
    }, 1000);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', init);

document.getElementById('networkSize').addEventListener('input', function() {
    document.getElementById('networkSizeValue').textContent = this.value + ' Nodes';
});

document.getElementById('flowSpeed').addEventListener('input', function() {
    document.getElementById('flowSpeedValue').textContent = parseFloat(this.value).toFixed(1) + 'x';
});

document.getElementById('activationRate').addEventListener('input', function() {
    document.getElementById('activationRateValue').textContent = Math.round(this.value * 100) + '%';
});

document.getElementById('visualIntensity').addEventListener('input', function() {
    document.getElementById('visualIntensityValue').textContent = Math.round(this.value * 100) + '%';
});

document.getElementById('audioBtn').addEventListener('click', startAudioVisualization);
document.getElementById('autoBtn').addEventListener('click', toggleAutoMode);
document.querySelector('#controls .button-group button:nth-child(3)').addEventListener('click', resetNetwork);
document.getElementById('networkSize').addEventListener('change', updateNetworkSize);
document.getElementById('flowSpeed').addEventListener('change', updateFlowSpeed);
document.getElementById('activationRate').addEventListener('change', updateActivationRate);
document.getElementById('visualIntensity').addEventListener('change', updateVisualIntensity);