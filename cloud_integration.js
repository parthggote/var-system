// Cloud Integration Module
class CloudIntegration {
    constructor() {
        // Use environment variable for API endpoint
        this.API_ENDPOINT = process.env.API_ENDPOINT || 'https://var-backend.onrender.com';
        this.MODEL_ENDPOINT = `${this.API_ENDPOINT}/models`;
        this.DB_ENDPOINT = `${this.API_ENDPOINT}/db`;
        this.LLM_ENDPOINT = `${this.API_ENDPOINT}/llm`;
    }

    // Initialize TensorFlow.js model
    async initializeModel() {
        try {
            // Load the MoveNet model
            const detectorConfig = {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            };
            this.detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                detectorConfig
            );
            return true;
        } catch (error) {
            console.error('Error initializing model:', error);
            return false;
        }
    }

    // Process video frame and send to cloud
    async processFrame(videoFrame) {
        try {
            // Local pose detection
            const poses = await this.detector.estimatePoses(videoFrame);
            
            if (poses && poses.length > 0) {
                // Prepare data for cloud processing
                const frameData = {
                    keypoints: poses[0].keypoints.map(kp => ({
                        name: kp.name,
                        x: kp.x,
                        y: kp.y,
                        score: kp.score
                    })),
                    timestamp: Date.now()
                };

                // Send to cloud for advanced analysis
                const response = await this.sendToCloud(frameData);
                return response;
            }
            return null;
        } catch (error) {
            console.error('Error processing frame:', error);
            return null;
        }
    }

    // Send data to cloud for processing
    async sendToCloud(data) {
        try {
            const response = await fetch(`${this.MODEL_ENDPOINT}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Cloud processing failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending to cloud:', error);
            return null;
        }
    }

    // Get decision explanation from LLM
    async getDecisionExplanation(incidentData) {
        try {
            const response = await fetch(`${this.LLM_ENDPOINT}/explain`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(incidentData)
            });

            if (!response.ok) {
                throw new Error('LLM explanation failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting LLM explanation:', error);
            return null;
        }
    }

    // Save analysis results to cloud database
    async saveResults(results) {
        try {
            const response = await fetch(`${this.DB_ENDPOINT}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(results)
            });

            if (!response.ok) {
                throw new Error('Failed to save results');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving results:', error);
            return null;
        }
    }
}

// Export the class
export default CloudIntegration; 