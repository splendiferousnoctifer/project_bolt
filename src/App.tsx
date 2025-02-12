import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { stories } from './stories';
import { Sun, Moon } from 'lucide-react';
import type { Story, StoryNode } from './types';

type GameState = 'normal' | 'story-select' | 'playing';
type StoryProgress = {
  storyId: string;
  currentNode: StoryNode;
  waitingForExpression: boolean;
  expressionTimer: number;
  selectedChoice?: string;
};

type Detection = {
  detection?: faceapi.FaceDetection;
  expressions?: faceapi.FaceExpressions;
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState<string>('');
  const [debug, setDebug] = useState(false);
  const [visualDebug, setVisualDebug] = useState(false);
  const [debugData, setDebugData] = useState<Record<string, number>>({});
  const [detectionData, setDetectionData] = useState<Detection>({});
  const [gameState, setGameState] = useState<GameState>('normal');
  const [storyProgress, setStoryProgress] = useState<StoryProgress | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [showChoices, setShowChoices] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [systemReady, setSystemReady] = useState(false);

  // Constants
  const CONFIDENCE_THRESHOLD = 0.5;
  const EXPRESSION_WAIT_TIME = 2000;
  const TYPING_SPEED = 30;

  const DarkModeToggle = () => (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="fixed top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <Sun className="text-gray-900 dark:text-white" size={20} />
      ) : (
        <Moon className="text-gray-900 dark:text-white" size={20} />
      )}
    </button>
  );

  const DebugOverlay = () => (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm">
      <div className="mb-2 text-accent-dark">Debug Mode</div>
      <div className="mb-2">
        <span className="text-accent-dark">Press 'D':</span> Toggle numbers
        <br />
        <span className="text-accent-dark">Press 'V':</span> Toggle video feed
      </div>
      <div className="grid grid-cols-2 gap-x-4">
        <div>Happy:</div>
        <div>{debugData.happy?.toFixed(4) || '0.0000'}</div>
        <div>Sad:</div>
        <div>{debugData.sad?.toFixed(4) || '0.0000'}</div>
        <div>Surprised:</div>
        <div>{debugData.surprised?.toFixed(4) || '0.0000'}</div>
        <div>Angry:</div>
        <div>{debugData.angry?.toFixed(4) || '0.0000'}</div>
      </div>
    </div>
  );

  const VideoDebug = () => (
    <div className="fixed top-4 left-4 rounded-lg overflow-hidden shadow-lg">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-[640px] h-[480px]"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );

  // Add debug logging function
  const debugLog = (message: string, data?: any) => {
    if (debug) {
      console.log(`[FaceAPI Debug] ${message}`, data || '');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      console.log('🚀 Starting system initialization...');
      console.log('📦 Loading face detection models...');
      try {
        const modelsPath = '/models';
        
        console.log('  ⌛ Loading TinyFaceDetector...');
        await faceapi.nets.tinyFaceDetector.load(modelsPath);
        console.log('  ✅ TinyFaceDetector loaded successfully');
        
        console.log('  ⌛ Loading FaceExpressionNet...');
        await faceapi.nets.faceExpressionNet.load(modelsPath);
        console.log('  ✅ FaceExpressionNet loaded successfully');
        
        setModelsLoaded(true);
        console.log('✅ All models loaded successfully');
      } catch (error) {
        console.error('❌ Error loading models:', error);
        alert('Failed to load emotion detection models. Please refresh the page and ensure you have a stable internet connection.');
      }
    };

    loadModels();
  }, [debug]);

  // Initialize video
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) {
      console.log('⏳ Waiting for models before initializing video...', {
        modelsLoaded,
        hasVideoRef: !!videoRef.current
      });
      return;
    }

    const startVideo = async () => {
      console.log('📹 Starting camera initialization...');
      try {
        // First check if we have permissions
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('  📝 Camera permission status:', permissions.state);
        
        if (permissions.state === 'denied') {
          throw new Error('Camera access denied. Please enable camera access in your browser settings.');
        }

        const constraints = {
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };
        console.log('  ⌛ Requesting camera permissions...');
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('  ✅ Camera permissions granted');
        console.log('  📊 Stream info:', {
          tracks: stream.getTracks().length,
          settings: stream.getVideoTracks()[0]?.getSettings()
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setVideoReady(true);
            console.log('✅ Camera feed ready and streaming');
          };
          videoRef.current.onerror = (error) => {
            console.error('❌ Video element error:', error);
          };
        }
      } catch (err) {
        console.error('❌ Camera initialization failed:', err);
        if (err instanceof Error) {
          alert(`Failed to access webcam: ${err.message}`);
        } else {
          alert('Failed to access webcam. Please ensure you have granted camera permissions and try again.');
        }
      }
    };

    startVideo();

    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modelsLoaded]);

  useEffect(() => {
    if (modelsLoaded && videoReady) {
      setSystemReady(true);
      console.log('🎉 System fully initialized and ready!');
      console.log('📝 Status:', {
        modelsLoaded: true,
        videoReady: true,
        systemReady: true
      });
    }
  }, [modelsLoaded, videoReady]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'd') {
        setDebug(prev => !prev);
      } else if (event.key.toLowerCase() === 'v') {
        setVisualDebug(prev => !prev);
      } else if (event.key.toLowerCase() === 's') {
        setGameState(prev => prev === 'story-select' ? 'normal' : 'story-select');
        setStoryProgress(null);
        setDisplayedText('');
        setShowChoices(false);
      } else if (event.key.toLowerCase() === 'escape') {
        setGameState('normal');
        setStoryProgress(null);
        setDisplayedText('');
        setShowChoices(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Face detection
  useEffect(() => {
    if (!videoRef.current || !modelsLoaded || 
        (gameState === 'playing' && (!showChoices || storyProgress?.selectedChoice))) {
      debugLog('Skipping detection - conditions not met:', {
        hasVideoRef: !!videoRef.current,
        modelsLoaded,
        gameState,
        showChoices,
        hasSelectedChoice: !!storyProgress?.selectedChoice
      });
      return;
    }

    let isProcessing = false;
    let rafId: number;
    let frameCount = 0;
    let lastFpsLog = Date.now();

    const detectExpressions = async () => {
      frameCount++;
      if (Date.now() - lastFpsLog >= 1000) {
        debugLog('FPS:', frameCount);
        frameCount = 0;
        lastFpsLog = Date.now();
      }

      if (!videoRef.current || isProcessing || 
          (gameState === 'playing' && storyProgress?.selectedChoice)) {
        rafId = requestAnimationFrame(detectExpressions);
        return;
      }

      try {
        isProcessing = true;
        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.3
        });
        
        const detections = await faceapi
          .detectSingleFace(videoRef.current, detectorOptions)
          .withFaceExpressions();

        if (detections) {
          const expressions = detections.expressions;
          const relevantExpressions = {
            happy: expressions.happy,
            sad: expressions.sad,
            surprised: expressions.surprised,
            angry: expressions.angry,
          };

          setDebugData(relevantExpressions);
          setDetectionData({
            detection: detections.detection,
            expressions: detections.expressions
          });

          if (visualDebug && canvasRef.current && videoRef.current) {
            const dims = {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight
            };
            
            faceapi.matchDimensions(canvasRef.current, dims);
            
            const context = canvasRef.current.getContext('2d');
            if (context) {
              context.clearRect(0, 0, dims.width, dims.height);
              faceapi.draw.drawDetections(canvasRef.current, [detections.detection]);
              
              const values = Object.entries(expressions)
                .map(([expression, value]) => `${expression}: ${value.toFixed(2)}`)
                .join('\n');
              
              new faceapi.draw.DrawTextField(
                [values],
                detections.detection.box.bottomLeft
              ).draw(canvasRef.current);
            }
          }

          const currentHighest = Object.entries(relevantExpressions).reduce((a, b) => 
            a[1] > b[1] ? a : b
          );

          if (currentHighest[1] >= CONFIDENCE_THRESHOLD) {
            setExpression(currentHighest[0].toUpperCase());

            if (storyProgress?.waitingForExpression && showChoices) {
              if (Date.now() - storyProgress.expressionTimer >= EXPRESSION_WAIT_TIME) {
                const expressionMap = {
                  happy: 0,
                  sad: 1,
                  angry: 2,
                  surprised: 3
                };
                
                const expressionIndex = expressionMap[currentHighest[0] as keyof typeof expressionMap];
                if (typeof expressionIndex === 'number' && storyProgress.currentNode.choices) {
                  const choiceNumber = storyProgress.currentNode.choices[expressionIndex];
                  if (choiceNumber) {
                    handleChoice(choiceNumber);
                  }
                }
              }
            }
          } else {
            setExpression('');
          }
        } else {
          debugLog('No face detected in frame');
          setExpression('');
        }
      } catch (err) {
        console.error('Error detecting expressions:', err);
        debugLog('Detection error:', err);
      } finally {
        isProcessing = false;
        if (!storyProgress?.selectedChoice) {
          rafId = requestAnimationFrame(detectExpressions);
        }
      }
    };

    debugLog('Starting detection loop');
    rafId = requestAnimationFrame(detectExpressions);
    
    return () => {
      if (rafId) {
        debugLog('Cleaning up detection loop');
        cancelAnimationFrame(rafId);
      }
    };
  }, [modelsLoaded, visualDebug, storyProgress, showChoices, debug]);

  // Story text display
  useEffect(() => {
    if (!storyProgress?.currentNode) return;
    
    setShowChoices(false);
    setDisplayedText('');
    
    let currentIndex = 0;
    const text = storyProgress.currentNode.is_ending 
      ? `${storyProgress.currentNode.text}\n\n${storyProgress.currentNode.ending}`
      : storyProgress.currentNode.text;
    
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        if (!storyProgress.currentNode.is_ending) {
          setShowChoices(true);
          setStoryProgress(prev => prev ? {
            ...prev,
            expressionTimer: Date.now(),
            waitingForExpression: true
          } : null);
        }
      }
    }, TYPING_SPEED);

    return () => clearInterval(interval);
  }, [storyProgress?.currentNode]);

  const handleStorySelect = (storyId: string) => {
    const story = stories[storyId];
    if (!story) return;
    
    setStoryProgress({
      storyId,
      currentNode: story.nodes.start,
      waitingForExpression: true,
      expressionTimer: Date.now()
    });
    setGameState('playing');
  };

  const handleChoice = (choiceId: string) => {
    const story = stories[storyProgress?.storyId || ''];
    if (!story || !storyProgress) return;

    const nextNode = story.nodes[choiceId];
    if (!nextNode) return;

    setStoryProgress(prev => prev ? {
      ...prev,
      selectedChoice: choiceId,
      waitingForExpression: false
    } : null);

    setTimeout(() => {
      setStoryProgress(prev => prev ? {
        ...prev,
        currentNode: nextNode,
        waitingForExpression: !nextNode.is_ending,
        expressionTimer: Date.now(),
        selectedChoice: undefined
      } : null);
    }, 1000);
  };

  if (!systemReady) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center text-gray-900 dark:text-white">
        <DarkModeToggle />
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-[1px] h-[1px] absolute"
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Initializing System</h1>
          <div className="space-y-2 mb-4">
            <p className={`${modelsLoaded ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`}>
              {modelsLoaded ? '✓ Emotion detection models loaded' : '⋯ Loading emotion detection models...'}
            </p>
            <p className={`${videoReady ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`}>
              {videoReady ? '✓ Camera feed initialized' : '⋯ Initializing camera feed...'}
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we set up the emotion detection system.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Make sure to allow camera access when prompted.
          </p>
        </div>
      </div>
    );
  }

  if (gameState === 'story-select') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-gray-900 dark:text-white">
        <DarkModeToggle />
        {visualDebug ? (
          <VideoDebug />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-[1px] h-[1px] absolute"
          />
        )}
        <h1 className="text-4xl font-bold mb-8">Choose Your Story</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {Object.entries(stories).map(([id, story]) => (
            <div
              key={id}
              onClick={() => handleStorySelect(id)}
              className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-bold mb-2">{story.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{story.description}</p>
            </div>
          ))}
        </div>
        <p className="fixed bottom-4 text-sm text-gray-500 dark:text-gray-400">Press 'ESC' to return to emotion tracker</p>
        {(debug || visualDebug) && <DebugOverlay />}
      </div>
    );
  }

  if (gameState === 'playing' && storyProgress) {
    const story = stories[storyProgress.storyId];
    const currentNode = storyProgress.currentNode;
    const choices = currentNode.choices?.map(id => ({
      ...story.nodes[id]
    })) || [];

    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-gray-900 dark:text-white">
        <DarkModeToggle />
        {visualDebug ? (
          <VideoDebug />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-[1px] h-[1px] absolute"
          />
        )}
        <div className="max-w-4xl w-full px-4">
          <p className="font-mono text-xl mb-8 leading-relaxed text-left whitespace-pre-line">
            {displayedText}
            <span className="animate-pulse">|</span>
          </p>
          {showChoices && choices.length > 0 && (
            <div className="mt-8">
              <div className="flex space-x-4">
                {choices.map((choice, index) => {
                  const expressionMap = ["HAPPY", "SAD", "ANGRY", "SURPRISED"];
                  const isSelected = storyProgress.selectedChoice === choice.id;
                  const isGrayedOut = storyProgress.selectedChoice && !isSelected;

                  return (
                    <div 
                      key={choice.id} 
                      className={`flex-1 p-4 rounded-lg min-h-[120px] flex items-center justify-center relative transition-all duration-1000
                        bg-gray-100 dark:bg-gray-800
                        ${isGrayedOut ? 'opacity-0' : 'opacity-100'}
                        ${isSelected ? 'ring-2 ring-gray-900 dark:ring-white' : ''}`}
                    >
                      <div className="flex flex-col items-center space-y-4 absolute">
                        <span className="font-semibold text-gray-900 dark:text-white">{expressionMap[index]}</span>
                        <span className="text-center text-gray-900 dark:text-white">{choice.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {currentNode.is_ending && (
            <div className="mt-8">
              <button
                onClick={() => setGameState('story-select')}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Choose Another Story
              </button>
            </div>
          )}
        </div>
        <p className="fixed bottom-4 text-sm text-gray-500 dark:text-gray-400">Press 'ESC' to return to emotion tracker</p>
        {(debug || visualDebug) && <DebugOverlay />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center text-gray-900 dark:text-white">
      <DarkModeToggle />
      {visualDebug ? (
        <VideoDebug />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-[1px] h-[1px] absolute"
        />
      )}
      <h1 className="text-6xl font-bold uppercase tracking-wider mb-4">
        {expression || 'Neutral'}
      </h1>
      <div className="flex space-x-8 text-sm text-gray-600 dark:text-gray-400">
        <span>HAPPY</span>
        <span>SAD</span>
        <span>ANGRY</span>
        <span>SURPRISED</span>
      </div>
      <p className="fixed bottom-4 text-sm text-gray-500 dark:text-gray-400">Press 'S' to enter Story Mode</p>
      {(debug || visualDebug) && <DebugOverlay />}
    </div>
  );
}

export default App;