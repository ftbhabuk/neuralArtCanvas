// Enhanced Neural Network Visualizer with Multi-Stage Cascades
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

let width, height
let nodes = []
let connections = []
let dataPulses = []
const backgroundParticles = []
let audioContext, analyser, dataArray
let autoMode = false
let networkSize = 150
let flowSpeed = 3
let activationRate = 0.4
let visualIntensity = 1
let cascadeDepth = 3
let frequencyData = []
let dominantFrequency = 0
let audioLevel = 0
const frequencyHistory = []
let time = 0
let currentCascadeLevel = 0

// Enhanced network output tracking
const networkOutput = {
  frequency: 0,
  amplitude: 0,
  classification: "silence",
  predictedFrequency: 0,
  predictedClassification: "...",
  networkActivation: 0,
  networkConfidence: 0,
  activeNodesCount: 0,
  audioSource: "",
  cascadeLevel: 0,
}

// Initialize background particles
function initBackgroundParticles() {
  const particleContainer = document.getElementById("bgParticles")
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div")
    particle.className = "particle"
    particle.style.left = Math.random() * 100 + "%"
    particle.style.animationDelay = Math.random() * 20 + "s"
    particle.style.animationDuration = 15 + Math.random() * 10 + "s"
    particleContainer.appendChild(particle)
  }
}

function resizeCanvas() {
  width = canvas.width = window.innerWidth
  height = canvas.height = window.innerHeight
}

// Enhanced Node class with multi-stage activation and memory
class Node {
  constructor(x, y, layer) {
    this.x = x
    this.y = y
    this.originalX = x
    this.originalY = y
    this.layer = layer
    this.activation = 0
    this.targetActivation = 0
    this.radius = Math.random() * 4 + 3
    this.forwardConnections = []
    this.backwardConnections = []
    this.lateralConnections = []
    this.pulseTime = 0
    this.lastActivation = 0
    this.hue = 120 + layer * 60 + Math.random() * 40
    this.breathePhase = Math.random() * Math.PI * 2
    this.energy = 0
    this.maxEnergy = 1

    // NEW: Multi-stage cascade properties
    this.cascadeLevel = 0
    this.maxCascadeLevel = 0
    this.memoryTrace = 0
    this.resonanceField = 0
    this.learningSignal = 0
    this.synapticStrength = Math.random() * 0.5 + 0.5
    this.activationHistory = []
    this.isInCascade = false
    this.cascadeTimer = 0
    this.backpropSignal = 0
  }

  update() {
    this.lastActivation = this.activation
    this.activation += (this.targetActivation - this.activation) * 0.15
    this.targetActivation *= 0.92

    // Update cascade properties
    this.cascadeLevel *= 0.95
    this.memoryTrace *= 0.98
    this.resonanceField *= 0.9
    this.learningSignal *= 0.85
    this.backpropSignal *= 0.9

    if (this.pulseTime > 0) {
      this.pulseTime -= 0.03
    }

    // Enhanced breathing animation with cascade influence
    const breathe = Math.sin(time * 0.02 + this.breathePhase) * 0.1
    const cascadeInfluence = this.cascadeLevel * 0.3
    this.x = this.originalX + breathe * 10 + cascadeInfluence * Math.cos(time * 0.05)
    this.y = this.originalY + breathe * 5 + cascadeInfluence * Math.sin(time * 0.05)

    // Energy decay with memory influence
    this.energy *= 0.98

    // Update activation history
    this.activationHistory.push(this.activation)
    if (this.activationHistory.length > 10) {
      this.activationHistory.shift()
    }

    // Cascade timer
    if (this.cascadeTimer > 0) {
      this.cascadeTimer--
      this.isInCascade = true
    } else {
      this.isInCascade = false
    }
  }

  draw() {
    const intensity = Math.max(this.activation, this.pulseTime, this.energy * 0.5)
    const cascadeIntensity = this.cascadeLevel * 0.8
    const totalIntensity = Math.max(intensity, cascadeIntensity)

    const alpha = 0.4 + totalIntensity * 0.6
    const size = this.radius * (1 + totalIntensity * 0.8) * visualIntensity

    // Draw memory trace (outer ring)
    if (this.memoryTrace > 0.1) {
      ctx.beginPath()
      ctx.strokeStyle = `hsla(${this.hue + 180}, 70%, 60%, ${this.memoryTrace * 0.6})`
      ctx.lineWidth = 2 * visualIntensity
      ctx.setLineDash([5, 5])
      ctx.arc(this.x, this.y, size * (1.8 + Math.sin(time * 0.1) * 0.2), 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw resonance field (floating particles)
    if (this.resonanceField > 0.2) {
      for (let i = 0; i < 6; i++) {
        const angle = (time * 0.02 + (i * Math.PI) / 3) % (Math.PI * 2)
        const distance = size * (2 + Math.sin(time * 0.05 + i) * 0.5)
        const particleX = this.x + Math.cos(angle) * distance
        const particleY = this.y + Math.sin(angle) * distance

        ctx.beginPath()
        ctx.fillStyle = `hsla(${this.hue + 120}, 80%, 70%, ${this.resonanceField * 0.4})`
        ctx.arc(particleX, particleY, 2 * visualIntensity, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Multiple glow layers for depth with cascade enhancement
    for (let i = 4; i >= 1; i--) {
      ctx.beginPath()
      const glowSize = size * (i * 1.5) * (1 + cascadeIntensity * 0.5)
      const glowAlpha = (alpha / (i * 2)) * (1 + cascadeIntensity)

      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize)

      // Cascade-influenced colors
      const cascadeHue = this.cascadeLevel > 0.5 ? this.hue + 60 : this.hue
      gradient.addColorStop(0, `hsla(${cascadeHue}, 80%, 60%, ${glowAlpha})`)
      gradient.addColorStop(0.5, `hsla(${cascadeHue + 20}, 70%, 50%, ${glowAlpha * 0.5})`)
      gradient.addColorStop(1, `hsla(${cascadeHue + 40}, 60%, 40%, 0)`)

      ctx.fillStyle = gradient
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Core node with cascade coloring
    ctx.beginPath()
    const coreHue = this.isInCascade ? this.hue + 120 : this.hue
    ctx.fillStyle = `hsla(${coreHue}, 90%, 70%, ${alpha})`
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2)
    ctx.fill()

    // Inner highlight
    ctx.beginPath()
    ctx.fillStyle = `hsla(${coreHue + 60}, 100%, 80%, ${alpha * 0.8})`
    ctx.arc(this.x - size * 0.3, this.y - size * 0.3, size * 0.4, 0, Math.PI * 2)
    ctx.fill()

    // Cascade-level pulsing rings
    if (this.cascadeLevel > 0.3) {
      for (let ring = 1; ring <= Math.floor(this.cascadeLevel * 3) + 1; ring++) {
        ctx.beginPath()
        ctx.strokeStyle = `hsla(${this.hue + ring * 40}, 100%, 80%, ${((this.cascadeLevel - 0.3) * 0.8) / ring})`
        ctx.lineWidth = (3 - ring) * visualIntensity
        const ringSize = size * (1.5 + ring * 0.5 + Math.sin(time * 0.1 + ring) * 0.2)
        ctx.arc(this.x, this.y, ringSize, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // Backpropagation signal (red/purple glow)
    if (this.backpropSignal > 0.2) {
      ctx.beginPath()
      const backpropGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, size * 2)
      backpropGradient.addColorStop(0, `rgba(255, 100, 150, ${this.backpropSignal * 0.6})`)
      backpropGradient.addColorStop(1, `rgba(255, 100, 150, 0)`)
      ctx.fillStyle = backpropGradient
      ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Learning signal indicator
    if (this.learningSignal > 0.3) {
      ctx.beginPath()
      ctx.strokeStyle = `rgba(255, 200, 0, ${this.learningSignal})`
      ctx.lineWidth = 3 * visualIntensity
      ctx.arc(this.x, this.y, size * 1.3, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  activate(intensity = 1, cascadeLevel = 0) {
    this.targetActivation = Math.min(1, this.targetActivation + intensity)
    this.pulseTime = 1
    this.energy = Math.min(this.maxEnergy, this.energy + intensity * 0.5)

    // NEW: Cascade activation
    this.cascadeLevel = Math.max(this.cascadeLevel, cascadeLevel)
    this.maxCascadeLevel = Math.max(this.maxCascadeLevel, cascadeLevel)
    this.memoryTrace = Math.max(this.memoryTrace, intensity * 0.8)
    this.resonanceField = Math.max(this.resonanceField, cascadeLevel * 0.6)
    this.cascadeTimer = 30 + cascadeLevel * 10

    // Update global cascade level
    currentCascadeLevel = Math.max(currentCascadeLevel, cascadeLevel)
  }

  // NEW: Trigger learning signal
  triggerLearning(intensity = 1) {
    this.learningSignal = intensity
    this.synapticStrength = Math.min(1, this.synapticStrength + intensity * 0.1)
  }

  // NEW: Trigger backpropagation
  triggerBackprop(intensity = 1) {
    this.backpropSignal = intensity
  }
}

// Enhanced Connection class with cascade-aware visuals
class Connection {
  constructor(from, to, type = "forward") {
    this.from = from
    this.to = to
    this.type = type
    this.weight = Math.random() * 0.6 + 0.4
    this.activity = 0
    this.maxActivity = 1
    this.baseAlpha = 0.1
    this.pulsePhase = Math.random() * Math.PI * 2
    this.cascadeActivity = 0 // NEW
    this.learningActivity = 0 // NEW
  }

  draw() {
    const distance = Math.sqrt((this.to.x - this.from.x) ** 2 + (this.to.y - this.from.y) ** 2)

    const alpha = this.baseAlpha + (this.activity + this.cascadeActivity) * 0.6 * visualIntensity
    const width = (1 + (this.activity + this.cascadeActivity) * 3) * visualIntensity

    // Enhanced pulse with cascade influence
    const pulse = Math.sin(time * 0.05 + this.pulsePhase) * 0.1 + 0.9
    const cascadePulse = this.cascadeActivity > 0 ? Math.sin(time * 0.1) * 0.3 + 1 : 1

    ctx.beginPath()
    ctx.lineWidth = width * pulse * cascadePulse

    // Enhanced colors for different connection types and states
    if (this.learningActivity > 0.2) {
      ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`
      ctx.shadowColor = "rgba(255, 200, 0, 0.5)"
    } else if (this.type === "backward") {
      ctx.strokeStyle = `rgba(255, 100, 150, ${alpha})`
      ctx.shadowColor = "rgba(255, 100, 150, 0.5)"
    } else if (this.type === "lateral") {
      ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`
      ctx.shadowColor = "rgba(100, 200, 255, 0.5)"
    } else {
      const cascadeHue = this.cascadeActivity > 0.3 ? 180 : 120
      ctx.strokeStyle = `hsla(${cascadeHue}, 80%, 60%, ${alpha})`
      ctx.shadowColor = `hsla(${cascadeHue}, 80%, 60%, 0.5)`
    }

    ctx.shadowBlur = (this.activity + this.cascadeActivity) * 15 * visualIntensity

    // More organic curved connections
    const midX = (this.from.x + this.to.x) / 2
    const midY = (this.from.y + this.to.y) / 2
    const curvature = (Math.random() - 0.5) * 100 * (1 + this.cascadeActivity)

    ctx.moveTo(this.from.x, this.from.y)
    ctx.quadraticCurveTo(midX + curvature, midY + curvature, this.to.x, this.to.y)
    ctx.stroke()

    ctx.shadowBlur = 0
  }

  update() {
    this.activity *= 0.85
    this.cascadeActivity *= 0.9 // NEW
    this.learningActivity *= 0.8 // NEW
  }
}

// Enhanced DataPulse class with multi-stage cascade effects
class DataPulse {
  constructor(connection, intensity = null, cascadeLevel = 0, pulseType = "forward") {
    this.connection = connection
    this.progress = 0
    this.speed = flowSpeed * (0.008 + Math.random() * 0.012)
    this.intensity = intensity || Math.random() * 0.9 + 0.1
    this.size = Math.random() * 4 + 3
    this.type = connection.type
    this.pulseType = pulseType // 'forward', 'backward', 'learning', 'cascade'
    this.history = []
    this.trailLength = 8 + cascadeLevel * 2
    this.cascadeLevel = cascadeLevel // NEW

    // Enhanced hue based on pulse type and cascade level
    if (pulseType === "learning") {
      this.hue = 50 // Yellow for learning
    } else if (pulseType === "backward") {
      this.hue = 320 // Purple for backprop
    } else if (this.type === "lateral") {
      this.hue = 200 // Cyan for lateral
    } else {
      this.hue = 120 + cascadeLevel * 60 // Green to blue spectrum for cascades
    }

    this.sparkles = []
    this.resonanceParticles = [] // NEW

    // Create enhanced sparkle particles
    const sparkleCount = 3 + cascadeLevel
    for (let i = 0; i < sparkleCount; i++) {
      this.sparkles.push({
        offset: Math.random() * Math.PI * 2,
        distance: Math.random() * 15 + 5 + cascadeLevel * 5,
        phase: Math.random() * Math.PI * 2,
        intensity: Math.random() * 0.8 + 0.2,
      })
    }

    // Create resonance particles for high cascade levels
    if (cascadeLevel > 1) {
      for (let i = 0; i < cascadeLevel * 2; i++) {
        this.resonanceParticles.push({
          offset: Math.random() * Math.PI * 2,
          distance: Math.random() * 25 + 10,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.1 + 0.05,
        })
      }
    }
  }

  update() {
    // Calculate current position with enhanced curve for cascades
    const midX = (this.connection.from.x + this.connection.to.x) / 2
    const midY = (this.connection.from.y + this.connection.to.y) / 2
    const curvature = 25 + this.cascadeLevel * 15

    const t = this.progress
    const currentX =
      (1 - t) * (1 - t) * this.connection.from.x + 2 * (1 - t) * t * (midX + curvature) + t * t * this.connection.to.x
    const currentY =
      (1 - t) * (1 - t) * this.connection.from.y + 2 * (1 - t) * t * (midY + curvature) + t * t * this.connection.to.y

    this.history.push({
      x: currentX,
      y: currentY,
      intensity: this.intensity,
      cascadeLevel: this.cascadeLevel,
    })
    if (this.history.length > this.trailLength) {
      this.history.shift()
    }

    this.progress += this.speed

    if (this.progress >= 1) {
      // Enhanced activation with cascade propagation
      this.connection.to.activate(this.intensity * this.connection.weight, this.cascadeLevel)

      // Update connection cascade activity
      this.connection.cascadeActivity = Math.max(this.connection.cascadeActivity, this.cascadeLevel * 0.8)

      this.propagate()
      return false
    }

    this.connection.activity = Math.max(this.connection.activity, this.intensity)
    return true
  }

  propagate() {
    const sourceNode = this.connection.to

    // Enhanced multi-stage cascade propagation
    if (this.pulseType === "forward" && sourceNode.layer < 3) {
      sourceNode.forwardConnections.forEach((conn) => {
        const prob = sourceNode.layer === 0 ? 0.95 : sourceNode.layer === 1 ? 0.8 : 0.6

        // Cascade probability increases with cascade level
        const cascadeProb = prob * (1 + this.cascadeLevel * 0.3)

        if (Math.random() < activationRate * cascadeProb) {
          const newCascadeLevel = Math.max(0, this.cascadeLevel - 0.3)
          dataPulses.push(new DataPulse(conn, this.intensity * 0.85, newCascadeLevel, "forward"))
        }
      })
    }

    // Enhanced backpropagation with learning signals
    if (
      (this.pulseType === "forward" || this.pulseType === "cascade") &&
      sourceNode.layer >= 2 &&
      Math.random() < activationRate * 0.3
    ) {
      sourceNode.backwardConnections.forEach((conn) => {
        if (Math.random() < 0.6) {
          // Trigger learning signal
          sourceNode.triggerLearning(this.intensity * 0.5)
          conn.learningActivity = this.intensity * 0.7

          dataPulses.push(new DataPulse(conn, this.intensity * 0.7, this.cascadeLevel * 0.8, "backward"))
        }
      })
    }

    // Enhanced lateral propagation with resonance
    if (Math.random() < activationRate * 0.4 && sourceNode.lateralConnections.length > 0) {
      sourceNode.lateralConnections.forEach((conn) => {
        if (Math.random() < 0.7) {
          // Create resonance effect
          sourceNode.resonanceField = Math.max(sourceNode.resonanceField, this.cascadeLevel * 0.6)

          dataPulses.push(new DataPulse(conn, this.intensity * 0.6, this.cascadeLevel * 0.9, "lateral"))
        }
      })
    }

    // NEW: Trigger secondary cascade waves
    if (this.cascadeLevel > 1.5 && Math.random() < 0.4) {
      setTimeout(
        () => {
          this.triggerSecondaryCascade(sourceNode)
        },
        200 + Math.random() * 300,
      )
    }
  }

  // NEW: Secondary cascade wave
  triggerSecondaryCascade(sourceNode) {
    const allConnections = [
      ...sourceNode.forwardConnections,
      ...sourceNode.backwardConnections,
      ...sourceNode.lateralConnections,
    ]

    allConnections.forEach((conn) => {
      if (Math.random() < 0.3) {
        dataPulses.push(new DataPulse(conn, this.intensity * 0.4, this.cascadeLevel - 1, "cascade"))
      }
    })
  }

  draw() {
    const t = this.progress
    const midX = (this.connection.from.x + this.connection.to.x) / 2
    const midY = (this.connection.from.y + this.connection.to.y) / 2
    const curvature = 25 + this.cascadeLevel * 15

    const x =
      (1 - t) * (1 - t) * this.connection.from.x + 2 * (1 - t) * t * (midX + curvature) + t * t * this.connection.to.x
    const y =
      (1 - t) * (1 - t) * this.connection.from.y + 2 * (1 - t) * t * (midY + curvature) + t * t * this.connection.to.y

    // Draw enhanced trail with cascade effects
    for (let i = 0; i < this.history.length; i++) {
      const trailPoint = this.history[i]
      const trailAlpha = (i / this.trailLength) * this.intensity * 0.6 * visualIntensity
      const trailSize = (i / this.trailLength) * this.size * (0.8 + trailPoint.cascadeLevel * 0.3)

      ctx.beginPath()
      const gradient = ctx.createRadialGradient(
        trailPoint.x,
        trailPoint.y,
        0,
        trailPoint.x,
        trailPoint.y,
        trailSize * 3,
      )

      const trailHue = this.hue + trailPoint.cascadeLevel * 30
      gradient.addColorStop(0, `hsla(${trailHue}, 80%, 60%, ${trailAlpha})`)
      gradient.addColorStop(0.7, `hsla(${trailHue + 20}, 70%, 50%, ${trailAlpha * 0.5})`)
      gradient.addColorStop(1, `hsla(${trailHue + 40}, 60%, 40%, 0)`)
      ctx.fillStyle = gradient
      ctx.arc(trailPoint.x, trailPoint.y, trailSize * 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw enhanced sparkles with cascade effects
    this.sparkles.forEach((sparkle, index) => {
      const sparkleX = x + Math.cos(time * 0.1 + sparkle.phase + sparkle.offset) * sparkle.distance
      const sparkleY = y + Math.sin(time * 0.1 + sparkle.phase + sparkle.offset) * sparkle.distance

      ctx.beginPath()
      const sparkleIntensity = sparkle.intensity * (1 + this.cascadeLevel * 0.5)
      ctx.fillStyle = `hsla(${this.hue + 60}, 100%, 80%, ${sparkleIntensity * visualIntensity})`
      ctx.arc(sparkleX, sparkleY, 1 + this.cascadeLevel * 0.5, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw resonance particles for high cascade levels
    this.resonanceParticles.forEach((particle) => {
      particle.phase += particle.speed
      const particleX = x + Math.cos(particle.phase + particle.offset) * particle.distance
      const particleY = y + Math.sin(particle.phase + particle.offset) * particle.distance

      ctx.beginPath()
      ctx.fillStyle = `hsla(${this.hue + 120}, 90%, 70%, ${this.cascadeLevel * 0.3 * visualIntensity})`
      ctx.arc(particleX, particleY, 2, 0, Math.PI * 2)
      ctx.fill()
    })

    // Main pulse with enhanced cascade layers
    const layerCount = 3 + Math.floor(this.cascadeLevel)
    for (let i = layerCount; i >= 1; i--) {
      ctx.beginPath()
      const pulseSize = this.size * i * (0.8 + this.cascadeLevel * 0.2) * visualIntensity
      const pulseAlpha = (this.intensity / i) * (1 + this.cascadeLevel * 0.3)

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize)
      const layerHue = this.hue + i * 20 + this.cascadeLevel * 10
      gradient.addColorStop(0, `hsla(${layerHue}, 90%, 70%, ${pulseAlpha})`)
      gradient.addColorStop(0.7, `hsla(${layerHue + 30}, 80%, 60%, ${pulseAlpha * 0.5})`)
      gradient.addColorStop(1, `hsla(${layerHue + 60}, 70%, 50%, 0)`)

      ctx.fillStyle = gradient
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Enhanced core pulse with cascade glow
    ctx.beginPath()
    const coreHue = this.hue + 60 + this.cascadeLevel * 30
    const coreSize = this.size * (1 + this.cascadeLevel * 0.4) * visualIntensity
    ctx.fillStyle = `hsla(${coreHue}, 100%, 90%, ${this.intensity * (1 + this.cascadeLevel * 0.5) * visualIntensity})`
    ctx.arc(x, y, coreSize, 0, Math.PI * 2)
    ctx.fill()

    // Cascade-level indicator ring
    if (this.cascadeLevel > 1) {
      ctx.beginPath()
      ctx.strokeStyle = `hsla(${this.hue + 180}, 100%, 80%, ${this.cascadeLevel * 0.6})`
      ctx.lineWidth = 2 * visualIntensity
      ctx.arc(x, y, coreSize * (1.5 + Math.sin(time * 0.2) * 0.3), 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

// Enhanced network initialization with better layer structure
function initNetwork() {
  nodes = []
  connections = []
  dataPulses = []
  currentCascadeLevel = 0

  const layers = 4
  const totalNodes = networkSize

  // More sophisticated node distribution
  const nodesPerLayer = [
    Math.floor(totalNodes * 0.2), // Input layer
    Math.floor(totalNodes * 0.35), // Hidden layer 1
    Math.floor(totalNodes * 0.3), // Hidden layer 2
    Math.floor(totalNodes * 0.15), // Output layer
  ]

  for (let layer = 0; layer < layers; layer++) {
    const layerNodesCount = nodesPerLayer[layer]
    const layerX = (width / (layers + 1)) * (layer + 1)

    // Create more organic node positioning with layer-specific patterns
    for (let i = 0; i < layerNodesCount; i++) {
      let x, y

      if (layer === 0 || layer === 3) {
        // Input and output layers: more linear arrangement
        y = (height / (layerNodesCount + 1)) * (i + 1) + (Math.random() - 0.5) * 60
        x = layerX + (Math.random() - 0.5) * 80
      } else {
        // Hidden layers: more circular/organic arrangement
        const angle = (i / layerNodesCount) * Math.PI * 2
        const radius = Math.min(width, height) * 0.15 + Math.random() * 60
        const centerY = height / 2

        x = layerX + Math.cos(angle) * (radius * 0.4) + (Math.random() - 0.5) * 100
        y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100
      }

      nodes.push(new Node(x, y, layer))
    }
  }

  // Enhanced connection creation with better probability distributions
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    // Forward connections with distance and layer-based probability
    const nextLayerNodes = nodes.filter((n) => n.layer === node.layer + 1)
    nextLayerNodes.forEach((nextNode) => {
      const distance = Math.sqrt((node.x - nextNode.x) ** 2 + (node.y - nextNode.y) ** 2)
      const maxDist = Math.max(width, height) / layers
      const probByDistance = 1 - Math.min(1, distance / maxDist)

      // Layer-specific connection probabilities
      let layerProb = 0.7
      if (node.layer === 0) layerProb = 0.9 // Input layer connects more
      if (node.layer === 2) layerProb = 0.8 // Pre-output layer connects more

      if (Math.random() < layerProb + probByDistance * 0.2) {
        const connection = new Connection(node, nextNode, "forward")
        connections.push(connection)
        node.forwardConnections.push(connection)
      }
    })

    // Backward connections (for backpropagation)
    const prevLayerNodes = nodes.filter((n) => n.layer === node.layer - 1)
    prevLayerNodes.forEach((prevNode) => {
      if (Math.random() < 0.25) {
        // Increased probability for better backprop
        const connection = new Connection(node, prevNode, "backward")
        connections.push(connection)
        node.backwardConnections.push(connection)
      }
    })

    // Lateral connections (within same layer)
    const sameLayerNodes = nodes.filter((n) => n.layer === node.layer && n !== node)
    sameLayerNodes.forEach((sameNode) => {
      const distance = Math.sqrt((node.x - sameNode.x) ** 2 + (node.y - sameNode.y) ** 2)
      const maxDist = Math.min(width, height) * 0.3

      if (distance < maxDist && Math.random() < 0.12) {
        // Distance-based lateral connections
        const connection = new Connection(node, sameNode, "lateral")
        connections.push(connection)
        node.lateralConnections.push(connection)
      }
    })
  }
}

// Enhanced animation loop with cascade decay
function animate() {
  time++

  // Decay global cascade level
  currentCascadeLevel *= 0.98

  // Dynamic background with cascade influence
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height))

  const cascadeInfluence = currentCascadeLevel * 0.1
  gradient.addColorStop(
    0,
    `rgba(${5 + cascadeInfluence * 20}, ${5 + cascadeInfluence * 10}, ${15 + cascadeInfluence * 30}, ${0.95 - Math.sin(time * 0.01) * 0.05})`,
  )
  gradient.addColorStop(
    0.5,
    `rgba(0, ${5 + cascadeInfluence * 15}, ${10 + cascadeInfluence * 20}, ${0.98 - Math.sin(time * 0.008) * 0.02})`,
  )
  gradient.addColorStop(1, "rgba(0, 0, 0, 1)")

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Update and draw connections
  connections.forEach((conn) => {
    conn.update()
    conn.draw()
  })

  // Update and draw nodes
  nodes.forEach((node) => {
    node.update()
    node.draw()
  })

  // Update and draw data pulses
  dataPulses = dataPulses.filter((pulse) => {
    const alive = pulse.update()
    if (alive) pulse.draw()
    return alive
  })

  // Process audio if available
  if (analyser) {
    processAudioData()
  }

  // Enhanced auto mode with cascade patterns
  if (autoMode) {
    if (Math.random() < 0.04) {
      if (Math.random() < 0.6) {
        triggerRandomPulse()
      } else if (Math.random() < 0.8) {
        triggerRandomPulseFromOutput()
      } else {
        triggerCascadeAvalanche() // NEW
      }
    }

    // Occasional synchronized burst with cascades
    if (Math.random() < 0.001) {
      triggerSynchronizedBurst()
    }
  }

  updateNetworkOutput()
  updateStatusDisplay()
  requestAnimationFrame(animate)
}

// NEW: Trigger cascade avalanche
function triggerCascadeAvalanche() {
  const inputNodes = nodes.filter((n) => n.layer === 0)
  const selectedNodes = inputNodes.slice(0, Math.floor(inputNodes.length * 0.3))

  selectedNodes.forEach((node, index) => {
    setTimeout(() => {
      const cascadeLevel = 2 + Math.random() * 2
      node.activate(0.8 + Math.random() * 0.2, cascadeLevel)

      node.forwardConnections.forEach((conn) => {
        if (Math.random() < 0.9) {
          dataPulses.push(new DataPulse(conn, 0.8, cascadeLevel, "forward"))
        }
      })
    }, index * 100)
  })
}

// NEW: Synchronized burst pattern
function triggerSynchronizedBurst() {
  const layers = [0, 1, 2, 3]

  layers.forEach((layerIndex, delay) => {
    setTimeout(() => {
      const layerNodes = nodes.filter((n) => n.layer === layerIndex)
      const burstCount = Math.floor(layerNodes.length * 0.4)

      for (let i = 0; i < burstCount; i++) {
        const randomNode = layerNodes[Math.floor(Math.random() * layerNodes.length)]
        const cascadeLevel = 1.5 + Math.random()
        randomNode.activate(0.7, cascadeLevel)

        // Trigger learning signals
        if (layerIndex > 1) {
          randomNode.triggerLearning(0.6)
        }
      }
    }, delay * 200)
  })
}

// Enhanced audio processing with cascade triggers
function processAudioData() {
  analyser.getByteFrequencyData(dataArray)

  let maxAmplitude = 0
  let maxIndex = 0
  let totalAmplitude = 0

  for (let i = 0; i < dataArray.length; i++) {
    totalAmplitude += dataArray[i]
    if (dataArray[i] > maxAmplitude) {
      maxAmplitude = dataArray[i]
      maxIndex = i
    }
  }

  audioLevel = totalAmplitude / dataArray.length
  dominantFrequency = (maxIndex * audioContext.sampleRate) / (2 * analyser.fftSize)
  frequencyData = Array.from(dataArray)

  frequencyHistory.push(dominantFrequency)
  if (frequencyHistory.length > 60) {
    frequencyHistory.shift()
  }

  classifySound()
  triggerFrequencyBasedActivation()

  // NEW: Trigger cascades based on audio intensity
  if (audioLevel > 80) {
    if (Math.random() < 0.1) {
      triggerCascadeAvalanche()
    }
  }
}

function classifySound() {
  if (audioLevel < 15) {
    networkOutput.classification = "silence"
  } else if (dominantFrequency < 250) {
    networkOutput.classification = "bass/drums"
  } else if (dominantFrequency < 500) {
    networkOutput.classification = "low voice"
  } else if (dominantFrequency < 1000) {
    networkOutput.classification = "mid voice"
  } else if (dominantFrequency < 2000) {
    networkOutput.classification = "high voice"
  } else if (dominantFrequency < 4000) {
    networkOutput.classification = "treble"
  } else {
    networkOutput.classification = "high freq"
  }
}

function updateNetworkOutput() {
  networkOutput.frequency = Math.round(dominantFrequency)
  networkOutput.amplitude = Math.round(audioLevel)
  networkOutput.cascadeLevel = currentCascadeLevel

  const outputNodes = nodes.filter((n) => n.layer === 3)
  if (outputNodes.length > 0) {
    const avgActivation = outputNodes.reduce((sum, node) => sum + node.activation, 0) / outputNodes.length
    networkOutput.networkActivation = avgActivation

    // Enhanced output classification with cascade influence
    let maxOutputActivation = 0
    let predictedFreq = 0
    let predictedClass = "..."
    let totalOutputActivation = 0

    const outputMapping = [
      { freq: 150, class: "bass/drums" },
      { freq: 400, class: "low voice" },
      { freq: 800, class: "mid voice" },
      { freq: 1500, class: "high voice" },
      { freq: 3000, class: "treble" },
      { freq: 6000, class: "high freq" },
    ]

    outputNodes.forEach((node, index) => {
      const cascadeBoost = node.cascadeLevel * 0.3
      const effectiveActivation = node.activation + cascadeBoost

      if (effectiveActivation > maxOutputActivation) {
        maxOutputActivation = effectiveActivation
        if (outputMapping[index]) {
          predictedFreq = outputMapping[index].freq
          predictedClass = outputMapping[index].class
        } else {
          predictedFreq = (index / outputNodes.length) * 8000 + Math.random() * 200
          predictedClass = `Class ${index}`
        }
      }
      totalOutputActivation += effectiveActivation
    })

    networkOutput.predictedFrequency = Math.round(predictedFreq)
    networkOutput.predictedClassification = predictedClass
    networkOutput.networkConfidence = totalOutputActivation > 0 ? maxOutputActivation / totalOutputActivation : 0
  }

  networkOutput.activeNodesCount = nodes.filter((node) => node.activation > 0.1 || node.cascadeLevel > 0.1).length
}

function triggerFrequencyBasedActivation() {
  if (audioLevel < 15) return

  const inputNodes = nodes.filter((n) => n.layer === 0)
  if (inputNodes.length === 0) return

  const bandWidth = analyser.frequencyBinCount / inputNodes.length

  for (let i = 0; i < inputNodes.length; i++) {
    const startBin = Math.floor(i * bandWidth)
    const endBin = Math.min(Math.floor((i + 1) * bandWidth), analyser.frequencyBinCount)

    let bandAmplitude = 0
    for (let j = startBin; j < endBin; j++) {
      bandAmplitude += dataArray[j]
    }
    bandAmplitude /= endBin - startBin

    if (bandAmplitude > 25) {
      const intensity = Math.min(1, bandAmplitude / 255)
      const cascadeLevel = intensity > 0.7 ? 1 + Math.random() : 0

      inputNodes[i].activate(intensity, cascadeLevel)

      inputNodes[i].forwardConnections.forEach((conn) => {
        if (Math.random() < 0.95) {
          dataPulses.push(new DataPulse(conn, intensity, cascadeLevel, "forward"))
        }
      })
    }
  }
}

function triggerRandomPulse(intensity = Math.random()) {
  const inputNodes = nodes.filter((n) => n.layer === 0)
  if (inputNodes.length > 0) {
    const randomNode = inputNodes[Math.floor(Math.random() * inputNodes.length)]
    const cascadeLevel = intensity > 0.6 ? Math.random() * 2 : 0

    randomNode.activate(intensity, cascadeLevel)
    randomNode.forwardConnections.forEach((conn) => {
      if (Math.random() < 0.85) {
        dataPulses.push(new DataPulse(conn, intensity, cascadeLevel, "forward"))
      }
    })
  }
}

function triggerRandomPulseFromOutput(intensity = Math.random()) {
  const outputNodes = nodes.filter((n) => n.layer === 3)
  if (outputNodes.length > 0) {
    const randomNode = outputNodes[Math.floor(Math.random() * outputNodes.length)]
    const cascadeLevel = intensity > 0.5 ? Math.random() * 1.5 : 0

    randomNode.activate(intensity, cascadeLevel)
    randomNode.triggerBackprop(intensity * 0.8)

    randomNode.backwardConnections.forEach((conn) => {
      if (Math.random() < 0.7) {
        dataPulses.push(new DataPulse(conn, intensity, cascadeLevel, "backward"))
      }
    })
  }
}

// Enhanced audio visualization
async function startAudioVisualization() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    })

    const source = audioContext.createMediaStreamSource(stream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    dataArray = new Uint8Array(analyser.frequencyBinCount)
    source.connect(analyser)

    networkOutput.audioSource = "desktop"
    document.getElementById("audioBtn").classList.add("active")
    document.getElementById("currentMode").textContent = "🎵 Audio Mode"

    if (autoMode) {
      toggleAutoMode()
    }
  } catch (err) {
    console.error("Error accessing system audio:", err)
    alert("Could not access system audio. Using auto mode instead.")
    if (!autoMode) {
      toggleAutoMode()
    }
  }
}

function toggleAutoMode() {
  autoMode = !autoMode
  const autoBtn = document.getElementById("autoBtn")
  const currentModeEl = document.getElementById("currentMode")

  if (autoMode) {
    autoBtn.textContent = "⏸️ Stop Auto"
    autoBtn.classList.add("active")
    currentModeEl.textContent = "🤖 Auto Mode"
    networkOutput.audioSource = "auto"
  } else {
    autoBtn.textContent = "🤖 Auto Mode"
    autoBtn.classList.remove("active")
    currentModeEl.textContent = "⏸️ Paused"
  }

  if (autoMode && audioContext) {
    audioContext.close()
    audioContext = null
    analyser = null
    document.getElementById("audioBtn").classList.remove("active")
  }
}

// NEW: Manual avalanche trigger
function triggerAvalanche() {
  triggerCascadeAvalanche()

  // Visual feedback
  const avalancheBtn = document.querySelector('button[onclick="triggerAvalanche()"]')
  avalancheBtn.style.background = "linear-gradient(135deg, rgba(0, 255, 170, 0.5), rgba(0, 200, 150, 0.6))"
  setTimeout(() => {
    avalancheBtn.style.background = ""
  }, 1000)
}

function resetNetwork() {
  initNetwork()
  dataPulses = []
  currentCascadeLevel = 0
}

function updateNetworkSize() {
  networkSize = Number.parseInt(document.getElementById("networkSize").value)
  document.getElementById("networkSizeValue").textContent = networkSize + " Nodes"
  resetNetwork()
}

function updateFlowSpeed() {
  flowSpeed = Number.parseFloat(document.getElementById("flowSpeed").value)
  document.getElementById("flowSpeedValue").textContent = flowSpeed.toFixed(1) + "x"
}

function updateActivationRate() {
  activationRate = Number.parseFloat(document.getElementById("activationRate").value)
  document.getElementById("activationRateValue").textContent = Math.round(activationRate * 100) + "%"
}

function updateVisualIntensity() {
  visualIntensity = Number.parseFloat(document.getElementById("visualIntensity").value)
  document.getElementById("visualIntensityValue").textContent = Math.round(visualIntensity * 100) + "%"
}

// NEW: Update cascade depth
function updateCascadeDepth() {
  cascadeDepth = Number.parseInt(document.getElementById("cascadeDepth").value)
  document.getElementById("cascadeDepthValue").textContent = cascadeDepth + " Stages"
}

function updateStatusDisplay() {
  document.getElementById("activeNodes").textContent = networkOutput.activeNodesCount
  document.getElementById("activePulses").textContent = dataPulses.length
  document.getElementById("networkActivity").textContent = Math.round(networkOutput.networkActivation * 100) + "%"
  document.getElementById("cascadeLevel").textContent = Math.round(currentCascadeLevel * 100) / 100
  document.getElementById("dominantFreq").textContent = networkOutput.frequency + " Hz"
  document.getElementById("audioLevel").textContent = networkOutput.amplitude
}

// Enhanced click interaction with multi-stage cascades
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  let nearestNode = null
  let minDistance = Number.POSITIVE_INFINITY

  nodes.forEach((node) => {
    const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
    if (distance < minDistance) {
      minDistance = distance
      nearestNode = node
    }
  })

  if (nearestNode && minDistance < 50) {
    // Enhanced single node activation with cascade
    const cascadeLevel = 2 + Math.random() * 2
    nearestNode.activate(1, cascadeLevel)
    nearestNode.triggerLearning(0.8)

    // Create enhanced burst effect with cascades
    nearestNode.forwardConnections.forEach((conn) => {
      dataPulses.push(new DataPulse(conn, 1, cascadeLevel, "forward"))
    })
    nearestNode.backwardConnections.forEach((conn) => {
      if (Math.random() < 0.6) {
        dataPulses.push(new DataPulse(conn, 0.8, cascadeLevel * 0.8, "backward"))
      }
    })
    nearestNode.lateralConnections.forEach((conn) => {
      if (Math.random() < 0.6) {
        dataPulses.push(new DataPulse(conn, 0.6, cascadeLevel * 0.9, "lateral"))
      }
    })
  } else {
    // Enhanced multi-ripple cascade effect
    const clickIntensity = 0.9
    const rippleCount = cascadeDepth

    for (let ripple = 0; ripple < rippleCount; ripple++) {
      setTimeout(() => {
        const rippleRadius = (ripple + 1) * 100
        const affectedNodes = nodes.filter((node) => {
          const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
          return distance < rippleRadius && distance > ripple * 100
        })

        affectedNodes.forEach((node) => {
          const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
          const intensity = clickIntensity * (1 - distance / rippleRadius)
          const cascadeLevel = (rippleCount - ripple) * 0.8

          setTimeout(() => {
            node.activate(intensity, cascadeLevel)

            // Enhanced cascade propagation
            ;[...node.forwardConnections, ...node.lateralConnections].forEach((conn) => {
              if (Math.random() < intensity * 0.9) {
                const cascadePulse = new DataPulse(conn, intensity * 0.7, cascadeLevel, "cascade")
                dataPulses.push(cascadePulse)
              }
            })

            // Trigger learning signals for deeper ripples
            if (ripple > 1) {
              node.triggerLearning(intensity * 0.6)
            }
          }, distance * 1.2)
        })
      }, ripple * 250)
    }
  }
})

// Initialize everything
function init() {
  initBackgroundParticles()
  resizeCanvas()
  initNetwork()

  // Hide loading screen
  setTimeout(() => {
    document.getElementById("loading").style.display = "none"
    animate()
  }, 1000)
}

// Event listeners
window.addEventListener("resize", resizeCanvas)
window.addEventListener("load", init)

// Update range value displays
document.getElementById("networkSize").addEventListener("input", function () {
  document.getElementById("networkSizeValue").textContent = this.value + " Nodes"
})

document.getElementById("flowSpeed").addEventListener("input", function () {
  document.getElementById("flowSpeedValue").textContent = Number.parseFloat(this.value).toFixed(1) + "x"
})

document.getElementById("activationRate").addEventListener("input", function () {
  document.getElementById("activationRateValue").textContent = Math.round(this.value * 100) + "%"
})

document.getElementById("visualIntensity").addEventListener("input", function () {
  document.getElementById("visualIntensityValue").textContent = Math.round(this.value * 100) + "%"
})

document.getElementById("cascadeDepth").addEventListener("input", function () {
  document.getElementById("cascadeDepthValue").textContent = this.value + " Stages"
})
