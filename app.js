// DOM Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const videoUpload = document.getElementById('videoUpload');
const inputVideo = document.getElementById('inputVideo');
const outputCanvas = document.getElementById('outputCanvas');
const analyzeBtn = document.getElementById('analyzeBtn');
const stopBtn = document.getElementById('stopBtn');
const poseStatus = document.getElementById('poseStatus');
const statusText = document.getElementById('statusText');
const severitySelect = document.getElementById('severitySelect');
const confidenceCircle = document.getElementById('confidence-circle');
const confidencePercentage = document.getElementById('confidencePercentage');
const decisionBadge = document.getElementById('decisionBadge');
const micBtn = document.getElementById('micBtn');
const recordingStatus = document.getElementById('recordingStatus');
const transcriptionMessages = document.getElementById('transcriptionMessages');
const reasoningList = document.getElementById('reasoningList');
const expandXAI = document.getElementById('expandXAI');
const xaiModal = document.getElementById('xaiModal');
const closeModal = document.getElementById('closeModal');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const factorsChartCanvas = document.getElementById('factorsChart');
const largeFactorsChartCanvas = document.getElementById('largeFactorsChart');
const movementHeatmapCanvas = document.getElementById('movementHeatmap');
const detailedReasoning = document.getElementById('detailedReasoning');
const clearTranscriptsBtn = document.getElementById('clearTranscriptsBtn');
const offsideToggle = document.getElementById('offsideToggle');

// Manual selection state
let manualSelectionMode = false;
let manualAttacker = null;
let manualDefender = null;
let manualBall = null;
let currentSelectionType = null;

const manualSelectionControls = document.getElementById('manualSelectionControls');
const selectAttackerBtn = document.getElementById('selectAttackerBtn');
const selectDefenderBtn = document.getElementById('selectDefenderBtn');
const selectBallBtn = document.getElementById('selectBallBtn');
const selectionStatus = document.getElementById('selectionStatus');

// Frame-by-frame navigation
const prevFrameBtn = document.getElementById('prevFrameBtn');
const nextFrameBtn = document.getElementById('nextFrameBtn');

// Goal-line analysis
const goalLineToggle = document.getElementById('goalLineToggle');
let goalLineMode = false;

// Export report
const exportReportBtn = document.getElementById('exportReportBtn');

// Global state
let detector = null;
let videoPlaying = false;
let analysisRunning = false;
let animationId = null;
let recognition = null;
let isRecording = false;
let confidenceChartInstance = null;
let largeChartInstance = null;
let heatmapInstance = null;
let currentSeverity = null;
let currentConfidence = 0;
let recognitionEnabled = false;
let factorsChart;
let largeFactorsChart;
let heatmapChart;
let isAnalyzing = false;
let heatmapPoints = [];
let offsideMode = false;
let lastOffsideResult = null;
let lastDetectedPoses = null;

// Simulated pose statuses for demo
const poseStatuses = [
    'Natural Movement',
    'Suspicious Fall',
    'Intentional Hand Movement',
    'Natural Collision',
    'Simulated Contact'
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    initializeCanvasContext();
    initializeCharts();
    setupEventListeners();
    initializeSpeechRecognition();
    loadSavedTranscripts(); // Restore transcript history on load
});

// Dark mode toggle
function initializeDarkMode() {
    // Check for user preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
    }

    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
    localStorage.setItem('darkMode', 'enabled');
    updateChartsForDarkMode(true);
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    darkModeToggle.checked = false;
    localStorage.setItem('darkMode', 'disabled');
    updateChartsForDarkMode(false);
}

// Canvas initialization
function initializeCanvasContext() {
    canvas = outputCanvas;
    ctx = canvas.getContext('2d');
}

// Chart initialization
function initializeCharts() {
    // Small factors chart
    const factorsCtx = document.getElementById('factorsChart').getContext('2d');
    factorsChart = new Chart(factorsCtx, createFactorsChartConfig(true));

    // Large factors chart
    const largeFactorsCtx = document.getElementById('largeFactorsChart').getContext('2d');
    largeFactorsChart = new Chart(largeFactorsCtx, createFactorsChartConfig(false));

    // Heatmap chart placeholder
    const heatmapCtx = document.getElementById('movementHeatmap').getContext('2d');
    heatmapChart = new Chart(heatmapCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Movement Points',
                data: generateDummyHeatmapData(),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `Position: (${point.x}, ${point.y}), Intensity: ${point.intensity}`;
                        }
                    }
                }
            }
        }
    });
}

function createFactorsChartConfig(isSmall) {
    return {
        type: 'bar',
        data: {
            labels: ['Arm Position', 'Hip Direction', 'Fall Speed', 'Body Angle', 'Contact Force'],
            datasets: [{
                label: 'Factor Importance',
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#e74c3c',
                    '#f39c12',
                    '#9b59b6'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        display: !isSmall
                    },
                    grid: {
                        display: !isSmall
                    }
                },
                x: {
                    ticks: {
                        display: !isSmall
                    },
                    grid: {
                        display: !isSmall
                    }
                }
            },
            plugins: {
                legend: {
                    display: !isSmall
                }
            }
        }
    };
}

function generateDummyHeatmapData() {
    const points = [];
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const intensity = Math.random() * 100;
        points.push({
            x,
            y,
            intensity
        });
    }
    return points;
}

function updateChartsForDarkMode(isDarkMode) {
    const textColor = isDarkMode ? '#f8f9fa' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Update all charts with new theme
    [factorsChart, largeFactorsChart, heatmapChart].forEach(chart => {
        if (chart.options.scales.y) {
            chart.options.scales.y.ticks = { ...chart.options.scales.y.ticks, color: textColor };
            chart.options.scales.y.grid = { ...chart.options.scales.y.grid, color: gridColor };
        }
        if (chart.options.scales.x) {
            chart.options.scales.x.ticks = { ...chart.options.scales.x.ticks, color: textColor };
            chart.options.scales.x.grid = { ...chart.options.scales.x.grid, color: gridColor };
        }
        if (chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend = {
                ...chart.options.plugins.legend,
                labels: { color: textColor }
            };
        }
        chart.update();
    });
}

// Event listeners
function setupEventListeners() {
    // Video upload
    videoUpload.addEventListener('change', handleVideoUpload);
    
    // Analysis controls
    analyzeBtn.addEventListener('click', startAnalysis);
    stopBtn.addEventListener('click', stopAnalysis);
    
    // Severity selector
    severitySelect.addEventListener('change', updateSeverityClassification);
    
    // Mic button
    micBtn.addEventListener('click', toggleSpeechRecognition);
    
    // XAI modal
    expandXAI.addEventListener('click', () => xaiModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => xaiModal.classList.add('hidden'));
    
    // Tab navigation
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Listen for toggle
    if (offsideToggle) {
        offsideToggle.addEventListener('change', () => {
            offsideMode = offsideToggle.checked;
            // Redraw overlay if paused
            if (offsideMode && inputVideo.paused) {
                detectPose(true); // force overlay
            } else {
                drawPose(lastDetectedPoses || []); // redraw without offside overlay
            }
        });
    }

    // Show/hide manual selection controls in offside mode
    if (offsideToggle) {
        offsideToggle.addEventListener('change', () => {
            if (offsideToggle.checked) {
                manualSelectionControls.style.display = 'block';
            } else {
                manualSelectionControls.style.display = 'none';
                manualAttacker = manualDefender = manualBall = null;
            }
        });
    }

    // Manual selection button logic
    selectAttackerBtn.addEventListener('click', () => {
        currentSelectionType = 'attacker';
        selectionStatus.textContent = 'Click on the attacker keypoint on the video.';
    });
    selectDefenderBtn.addEventListener('click', () => {
        currentSelectionType = 'defender';
        selectionStatus.textContent = 'Click on the defender keypoint on the video.';
    });
    selectBallBtn.addEventListener('click', () => {
        currentSelectionType = 'ball';
        selectionStatus.textContent = 'Click on the ball keypoint on the video.';
    });

    outputCanvas.addEventListener('click', (e) => {
        if (!currentSelectionType || !lastDetectedPoses || !lastDetectedPoses[0]) return;
        const rect = outputCanvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * inputVideo.videoWidth;
        const y = ((e.clientY - rect.top) / rect.height) * inputVideo.videoHeight;
        // Find nearest keypoint
        const keypoints = lastDetectedPoses[0].keypoints;
        let minDist = Infinity, nearest = null;
        for (const kp of keypoints) {
            const dist = Math.hypot(kp.x - x, kp.y - y);
            if (dist < minDist) {
                minDist = dist;
                nearest = kp;
            }
        }
        if (nearest) {
            if (currentSelectionType === 'attacker') manualAttacker = nearest;
            if (currentSelectionType === 'defender') manualDefender = nearest;
            if (currentSelectionType === 'ball') manualBall = nearest;
            selectionStatus.textContent = `${currentSelectionType.charAt(0).toUpperCase() + currentSelectionType.slice(1)} selected: ${nearest.name}`;
            currentSelectionType = null;
        }
    });

    // Frame-by-frame navigation
    prevFrameBtn.addEventListener('click', () => {
        inputVideo.pause();
        inputVideo.currentTime = Math.max(0, inputVideo.currentTime - (1 / 30));
    });
    nextFrameBtn.addEventListener('click', () => {
        inputVideo.pause();
        inputVideo.currentTime = Math.min(inputVideo.duration, inputVideo.currentTime + (1 / 30));
    });

    // Goal-line analysis toggle
    if (goalLineToggle) {
        goalLineToggle.addEventListener('change', () => {
            goalLineMode = goalLineToggle.checked;
            if (goalLineMode) {
                // Redraw overlay for goal-line
                detectPose(true);
            } else {
                drawPose(lastDetectedPoses || []);
            }
        });
    }

    // Export report
    exportReportBtn.addEventListener('click', () => {
        const report = {
            timestamp: new Date().toISOString(),
            offsideMode: offsideMode,
            goalLineMode: goalLineMode,
            manualAttacker: manualAttacker,
            manualDefender: manualDefender,
            manualBall: manualBall,
            lastOffsideResult: lastOffsideResult,
            aiDecision: statusText.textContent,
            xai: reasoningList.innerText,
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'var_decision_report.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Video upload and processing
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    inputVideo.src = url;
    inputVideo.hidden = false;
    
    // Show analysis controls when video is loaded
    inputVideo.onloadedmetadata = () => {
        document.querySelector('.analysis-controls').classList.remove('hidden');
    };
    // Clear heatmap data
    heatmapPoints = [];
    updateHeatmapChart();
}

async function startAnalysis() {
    if (isAnalyzing) return;
    isAnalyzing = true;
    
    analyzeBtn.disabled = true;
    poseStatus.classList.remove('hidden');
    
    try {
        // Load the MoveNet model
        if (!detector) {
            const detectorConfig = {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            };
            detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet, 
                detectorConfig
            );
        }
        
        // Start video playback
        await inputVideo.play();
        
        // Start detection loop
        detectionInterval = setInterval(detectPose, 100);
        
    } catch (error) {
        console.error('Error starting analysis:', error);
        statusText.textContent = 'Error: Could not start analysis';
        isAnalyzing = false;
        analyzeBtn.disabled = false;
    }
}

function stopAnalysis() {
    clearInterval(detectionInterval);
    inputVideo.pause();
    poseStatus.classList.add('hidden');
    analyzeBtn.disabled = false;
    isAnalyzing = false;
    // Optionally, keep heatmapPoints for review, or clear if you want to reset
    // heatmapPoints = [];
    // updateHeatmapChart();
}

async function classifyPoseWithBackend(keypoints) {
    try {
        const response = await fetch('http://localhost:5001/classify_pose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keypoints })
        });
        if (!response.ok) throw new Error('Backend error');
        return await response.json();
    } catch (err) {
        console.error('Error calling backend:', err);
        return null;
    }
}

async function detectPose(forceOverlay = false) {
    if (!detector || !inputVideo.videoWidth) return;
    try {
        // Detect poses
        const poses = await detector.estimatePoses(inputVideo);
        lastDetectedPoses = poses;
        // Draw the detected poses
        drawPose(poses, forceOverlay);
        // If pose detected, send to backend
        if (poses && poses.length > 0) {
            const keypoints = poses[0].keypoints.map(kp => ({ name: kp.name, x: kp.x, y: kp.y, score: kp.score }));
            // Collect keypoints for heatmap (only those with high confidence)
            keypoints.forEach(kp => {
                if (kp.score > 0.3) {
                    // Normalize x, y to 0-100 for heatmap
                    const x = Math.round((kp.x / inputVideo.videoWidth) * 100);
                    const y = Math.round((kp.y / inputVideo.videoHeight) * 100);
                    heatmapPoints.push({ x, y, intensity: 50 });
                }
            });
            updateHeatmapChart();
            const backendResult = await classifyPoseWithBackend(keypoints);
            if (backendResult) {
                // Update pose status
                statusText.textContent = backendResult.label;
                // Update confidence ring
                updateConfidenceRing(backendResult.confidence);
                // Update XAI panel
                updateXAIFromBackend(backendResult);
            }
            // Offside prediction if mode enabled and paused
            if (offsideMode && inputVideo.paused) {
                lastOffsideResult = predictAndDrawOffside(keypoints);
            }
        }
    } catch (error) {
        console.error('Pose detection error:', error);
    }
}

function drawPose(poses, forceOverlay = false) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match video
    canvas.width = inputVideo.videoWidth;
    canvas.height = inputVideo.videoHeight;
    
    // Draw video frame
    ctx.drawImage(inputVideo, 0, 0, canvas.width, canvas.height);
    
    // Draw keypoints and connections
    if (poses && poses.length > 0) {
        const pose = poses[0];
        const keypoints = pose.keypoints;
        
        // Draw keypoints
        for (const keypoint of keypoints) {
            const { x, y, score } = keypoint;
            
            // Only draw keypoints with high confidence
            if (score > 0.3) {
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#00FF00';
                ctx.fill();
            }
        }
        
        // Draw connections between keypoints (simplified)
        drawConnections(keypoints);
        // Offside overlay
        if ((offsideMode && inputVideo.paused) || forceOverlay) {
            predictAndDrawOffside(keypoints, true);
        }
    }
}

function drawConnections(keypoints) {
    // Define connections (simplified skeleton)
    const connections = [
        ['nose', 'left_eye'], ['nose', 'right_eye'],
        ['left_eye', 'left_ear'], ['right_eye', 'right_ear'],
        ['nose', 'left_shoulder'], ['nose', 'right_shoulder'],
        ['left_shoulder', 'left_elbow'], ['right_shoulder', 'right_elbow'],
        ['left_elbow', 'left_wrist'], ['right_elbow', 'right_wrist'],
        ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
        ['left_hip', 'left_knee'], ['right_hip', 'right_knee'],
        ['left_knee', 'left_ankle'], ['right_knee', 'right_ankle'],
        ['left_shoulder', 'right_shoulder'], ['left_hip', 'right_hip']
    ];
    
    // Create a keypoint map for easier lookup
    const keypointMap = {};
    keypoints.forEach(keypoint => {
        keypointMap[keypoint.name] = keypoint;
    });
    
    // Draw lines between connected keypoints
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    for (const [startName, endName] of connections) {
        const startPoint = keypointMap[startName];
        const endPoint = keypointMap[endName];
        
        if (startPoint && endPoint && startPoint.score > 0.3 && endPoint.score > 0.3) {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
        }
    }
}

// Severity classification
function updateSeverityClassification() {
    const severity = severitySelect.value;
    if (!severity) return;
    
    // Update decision badge
    decisionBadge.className = 'decision-badge'; // Reset classes
    decisionBadge.classList.add(severity);
    
    // Update badge content
    const badge = decisionBadge.querySelector('span');
    const icon = decisionBadge.querySelector('i');
    icon.className = ''; // Clear previous icon
    
    switch (severity) {
        case 'minor':
            badge.textContent = 'Minor (No action)';
            icon.className = 'fas fa-check-circle';
            break;
        case 'moderate':
            badge.textContent = 'Moderate (Yellow Card)';
            icon.className = 'fas fa-exclamation-triangle';
            break;
        case 'severe':
            badge.textContent = 'Severe (Red Card or Penalty)';
            icon.className = 'fas fa-ban';
            break;
    }
    
    // Animate confidence percentage
    animateConfidence();
    
    // Update reasoning
    updateReasoning(severity);
    
    // Update charts
    updateFactorCharts(severity);
}

function animateConfidence() {
    // Generate a realistic confidence value 
    const targetConfidence = 70 + Math.floor(Math.random() * 25);
    const duration = 1500; // Animation duration in ms
    const fps = 60;
    const interval = duration / fps;
    const step = (targetConfidence - currentConfidence) / (fps * (duration / 1000));
    
    // Animation interval
    const animation = setInterval(() => {
        currentConfidence += step;
        
        if ((step > 0 && currentConfidence >= targetConfidence) || 
            (step < 0 && currentConfidence <= targetConfidence)) {
            currentConfidence = targetConfidence;
            clearInterval(animation);
        }
        
        // Update confidence display
        const roundedConfidence = Math.round(currentConfidence);
        confidencePercentage.textContent = `${roundedConfidence}%`;
        
        // Update circle
        const circumference = 282.7; // 2 * π * 45 (circle radius)
        const offset = circumference - (circumference * roundedConfidence / 100);
        confidenceCircle.style.strokeDashoffset = offset;
    }, interval);
}

// Speech Recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // Initialize speech recognition
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Handle results
        recognition.onresult = handleSpeechResult;
        
        // Handle end of speech
        recognition.onend = () => {
            if (recognitionEnabled) {
                recognition.start();
            } else {
                micBtn.classList.remove('recording');
                recordingStatus.textContent = 'Click to start recording';
            }
        };
        
        // Handle errors
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            recordingStatus.textContent = `Error: ${event.error}`;
            micBtn.classList.remove('recording');
            recognitionEnabled = false;
        };
        
        recognitionEnabled = false;
    } else {
        // Browser doesn't support speech recognition
        recordingStatus.textContent = 'Speech recognition not supported';
        micBtn.disabled = true;
    }
}

function toggleSpeechRecognition() {
    if (!recognition) return;
    
    if (!recognitionEnabled) {
        // Start recognition
        recognition.start();
        recognitionEnabled = true;
        micBtn.classList.add('recording');
        recordingStatus.textContent = 'Recording...';
    } else {
        // Stop recognition
        recognition.stop();
        recognitionEnabled = false;
        micBtn.classList.remove('recording');
        recordingStatus.textContent = 'Click to start recording';
    }
}

function handleSpeechResult(event) {
    if (!event.results || event.results.length === 0) return;
    
    // Get the most recent result
    const result = event.results[event.results.length - 1];
    
    // Check if it's a final result
    if (result.isFinal) {
        const transcript = result[0].transcript.trim();
        if (transcript) {
            addTranscriptionMessage(transcript);
        }
    }
}

function addTranscriptionMessage(text) {
    // Create message element
    const message = document.createElement('div');
    message.className = 'message';
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    const now = new Date();
    timestamp.textContent = now.toLocaleTimeString();
    
    // Add content
    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = text;
    
    // Assemble and add to messages
    message.appendChild(timestamp);
    message.appendChild(content);
    transcriptionMessages.appendChild(message);
    
    // Scroll to bottom
    transcriptionMessages.scrollTop = transcriptionMessages.scrollHeight;
    
    // Save to localStorage (optional)
    saveTranscriptToLocalStorage(text, now);
}

function saveTranscriptToLocalStorage(text, timestamp) {
    // Get existing transcripts or initialize empty array
    const transcripts = JSON.parse(localStorage.getItem('varTranscripts') || '[]');
    
    // Add new transcript
    transcripts.push({
        text,
        timestamp: timestamp.toISOString()
    });
    
    // Store back to localStorage (limit to last 50 messages)
    localStorage.setItem('varTranscripts', JSON.stringify(transcripts.slice(-50)));
}

// Update reasoning based on severity
function updateReasoning(severity) {
    // Clear current reasoning
    reasoningList.innerHTML = '';
    detailedReasoning.innerHTML = '';
    
    let reasons;
    
    switch (severity) {
        case 'minor':
            reasons = [
                'Player contact was minimal and unintentional',
                'Arm position was in natural position (confidence: 87%)',
                'Fall speed matched expected physics (confidence: 92%)',
                'Body angle indicated attempt to avoid contact'
            ];
            break;
        
        case 'moderate':
            reasons = [
                'Moderate contact force detected in the collision',
                'Arm position slightly extended during contact (confidence: 76%)',
                'Hip rotation suggested slight intent (confidence: 68%)',
                'Player speed increased just before contact'
            ];
            break;
            
        case 'severe':
            reasons = [
                'Excessive contact force detected in analysis',
                'Arm extended unnaturally during contact (confidence: 93%)',
                'Body angle showed clear intent to obstruct opponent',
                'Movement pattern shows pre-meditated action',
                'Contact point targeted vulnerable area'
            ];
            break;
    }
    
    // Add reasons to the list
    reasons.forEach(reason => {
        const li = document.createElement('li');
        li.textContent = reason;
        reasoningList.appendChild(li);
    });
    
    // Add detailed reasoning in the modal
    const paragraph = document.createElement('p');
    paragraph.innerHTML = generateDetailedReasoning(severity, reasons);
    detailedReasoning.appendChild(paragraph);
}

function generateDetailedReasoning(severity, reasons) {
    let intro;
    
    switch (severity) {
        case 'minor':
            intro = 'The AI system has determined this incident to be minor with <strong>high confidence</strong>. The analysis of player movement and contact shows natural patterns consistent with regular play.';
            break;
        case 'moderate':
            intro = 'This incident has been classified as moderate, warranting a <strong>yellow card</strong>. The analysis shows some concerning patterns that indicate potential intent, though not with absolute certainty.';
            break;
        case 'severe':
            intro = 'This incident has been classified as severe with <strong>high confidence</strong>, warranting a <strong>red card or penalty</strong>. The movement analysis shows clear patterns of intentional dangerous play.';
            break;
    }
    
    return `${intro}<br><br>Key factors in this decision:<br><ul>${reasons.map(r => `<li>${r}</li>`).join('')}</ul><br>The system analyzed 247 similar incidents from previous matches to train its classification algorithm.`;
}

// Update factor charts based on severity
function updateFactorCharts(severity) {
    // Generate data based on severity
    let data;
    
    switch (severity) {
        case 'minor':
            data = [25, 15, 20, 10, 15];
            break;
        case 'moderate':
            data = [60, 55, 40, 50, 65];
            break;
        case 'severe':
            data = [90, 75, 85, 80, 95];
            break;
    }
    
    // Apply small random variation to make it look more realistic
    data = data.map(val => Math.max(0, Math.min(100, val + (Math.random() * 10 - 5))));
    
    // Update chart data
    factorsChart.data.datasets[0].data = [...data];
    largeFactorsChart.data.datasets[0].data = [...data];
    
    // Update heatmap with new random data
    heatmapChart.data.datasets[0].data = generateDummyHeatmapData();
    
    // Update all charts
    factorsChart.update();
    largeFactorsChart.update();
    heatmapChart.update();
}

// Load previously saved transcripts (optional)
function loadSavedTranscripts() {
    const transcripts = JSON.parse(localStorage.getItem('varTranscripts') || '[]');
    
    transcripts.forEach(transcript => {
        const date = new Date(transcript.timestamp);
        const text = transcript.text;
        
        // Create message element
        const message = document.createElement('div');
        message.className = 'message';
        
        // Add timestamp
        const timestampEl = document.createElement('div');
        timestampEl.className = 'timestamp';
        timestampEl.textContent = date.toLocaleTimeString();
        
        // Add content
        const contentEl = document.createElement('div');
        contentEl.className = 'content';
        contentEl.textContent = text;
        
        // Assemble and add to messages
        message.appendChild(timestampEl);
        message.appendChild(contentEl);
        transcriptionMessages.appendChild(message);
    });
    
    // Scroll to bottom if there are any messages
    if (transcripts.length > 0) {
        transcriptionMessages.scrollTop = transcriptionMessages.scrollHeight;
    }
}

clearTranscriptsBtn.addEventListener('click', () => {
    localStorage.removeItem('varTranscripts');
    transcriptionMessages.innerHTML = '';
});

function updateConfidenceRing(confidence) {
    currentConfidence = confidence;
    confidencePercentage.textContent = `${confidence}%`;
    const circumference = 282.7;
    const offset = circumference - (circumference * confidence / 100);
    confidenceCircle.style.strokeDashoffset = offset;
}

function updateXAIFromBackend(result) {
    // Update reasoning list
    reasoningList.innerHTML = '';
    const li = document.createElement('li');
    li.textContent = `AI classified as: ${result.label} (confidence: ${result.confidence}%)`;
    reasoningList.appendChild(li);
    // Add feature importances
    for (const [factor, value] of Object.entries(result.importances)) {
        const li = document.createElement('li');
        li.textContent = `${factor}: ${value}%`;
        reasoningList.appendChild(li);
    }
    // Update charts
    const data = Object.values(result.importances);
    factorsChart.data.datasets[0].data = [...data];
    largeFactorsChart.data.datasets[0].data = [...data];
    factorsChart.update();
    largeFactorsChart.update();
}

// Add a function to update the heatmap chart with real data
function updateHeatmapChart() {
    if (heatmapChart && heatmapChart.data && heatmapChart.data.datasets) {
        heatmapChart.data.datasets[0].data = [...heatmapPoints];
        heatmapChart.update();
    }
}

// Simple offside prediction and overlay
function predictAndDrawOffside(keypoints, drawOnly = false) {
    // Use manual selection if available
    let attacker = manualAttacker, defender = manualDefender, ball = manualBall;
    if (!attacker || !defender) {
        // fallback to auto-detection
        const filtered = keypoints.filter(kp => kp.score > 0.3);
        const sorted = [...filtered].sort((a, b) => b.x - a.x);
        if (sorted.length < 2) {
            showOffsideBadge(false, true); // hide badge
            return null;
        }
        attacker = sorted[0];
        defender = sorted[1];
        if (!ball) ball = filtered.find(kp => kp.name === 'right_ankle' || kp.name === 'left_ankle') || attacker;
    }
    // Draw overlay
    ctx.save();
    // Draw defender line
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(defender.x, 0);
    ctx.lineTo(defender.x, inputVideo.videoHeight);
    ctx.stroke();
    // Highlight attacker
    ctx.beginPath();
    ctx.arc(attacker.x, attacker.y, 12, 0, 2 * Math.PI);
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Highlight defender
    ctx.beginPath();
    ctx.arc(defender.x, defender.y, 12, 0, 2 * Math.PI);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Mark ball
    if (ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 10, 0, 2 * Math.PI);
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.restore();
    // Prediction logic: attacker is offside if further right than defender and ball
    let offside = false;
    if (!drawOnly) {
        if (attacker.x > defender.x && attacker.x > (ball ? ball.x : defender.x)) {
            offside = true;
        }
        // Show badge
        showOffsideBadge(offside);
    }
    return { attacker, defender, ball, offside };
}

function showOffsideBadge(offside, hide = false) {
    let badge = document.getElementById('offsideBadge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'offsideBadge';
        badge.style.position = 'absolute';
        badge.style.top = '80px';
        badge.style.right = '40px';
        badge.style.zIndex = 10;
        badge.style.fontSize = '2rem';
        badge.style.fontWeight = 'bold';
        badge.style.padding = '12px 24px';
        badge.style.borderRadius = '8px';
        badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        document.body.appendChild(badge);
    }
    if (hide) {
        badge.style.display = 'none';
        return;
    }
    badge.textContent = offside ? 'OFFSIDE' : 'ONSIDE';
    badge.style.background = offside ? '#e74c3c' : '#2ecc71';
    badge.style.color = '#fff';
    badge.style.display = 'block';
}

// Goal-line overlay (simple demo)
function drawGoalLineOverlay() {
    if (!goalLineMode || !inputVideo) return;
    ctx.save();
    // Draw goal line (assume left edge for demo)
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(5, inputVideo.videoHeight);
    ctx.stroke();
    // Optionally, highlight ball if over line
    if (manualBall && manualBall.x < 5) {
        showGoalLineBadge(true);
    } else {
        showGoalLineBadge(false);
    }
    ctx.restore();
}

function showGoalLineBadge(goal) {
    let badge = document.getElementById('goalLineBadge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'goalLineBadge';
        badge.style.position = 'absolute';
        badge.style.top = '140px';
        badge.style.right = '40px';
        badge.style.zIndex = 10;
        badge.style.fontSize = '2rem';
        badge.style.fontWeight = 'bold';
        badge.style.padding = '12px 24px';
        badge.style.borderRadius = '8px';
        badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        document.body.appendChild(badge);
    }
    badge.textContent = goal ? 'GOAL' : 'NO GOAL';
    badge.style.background = goal ? '#27ae60' : '#e67e22';
    badge.style.color = '#fff';
    badge.style.display = 'block';
} 