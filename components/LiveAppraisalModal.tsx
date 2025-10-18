import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveSession, LiveServerMessage, Modality, Type, Blob as GenAI_Blob, FunctionDeclaration } from "@google/genai";
import { useCamera } from '../hooks/useCamera';
import { decode, encode, decodeAudioData } from '../utils/audio';
import { InventoryItem } from '../types';
import { CameraIcon } from './icons/CameraIcon';
import { MicIcon } from './icons/MicIcon';
import Loader from './Loader';
import { ai } from '../services/geminiService';

interface LiveAppraisalModalProps {
  onClose: () => void;
  onAddItem: (item: Omit<InventoryItem, 'id' | 'status' | 'marketplaceListing' | 'listingPrice' | 'listingUrl'>) => void;
  onUpdateItem: (item: InventoryItem) => void;
  setError: (error: string | null) => void;
  itemToReview?: InventoryItem | null;
}

type TranscriptEntry = {
    role: 'user' | 'model';
    text: string;
};

const LiveAppraisalModal: React.FC<LiveAppraisalModalProps> = ({ onClose, onAddItem, onUpdateItem, setError, itemToReview }) => {
    const { videoRef, stream, error: cameraError } = useCamera();
    const [session, setSession] = useState<LiveSession | null>(null);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [statusText, setStatusText] = useState('Ready to start');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const inputAudioContextRef = useRef<AudioContext>();
    const outputAudioContextRef = useRef<AudioContext>();
    const scriptProcessorRef = useRef<ScriptProcessorNode>();
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode>();
    const nextStartTimeRef = useRef(0);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);

    useEffect(() => {
        if (itemToReview) {
            setCapturedImage(itemToReview.image);
        }
    }, [itemToReview]);

    const itemSchema = {
        type: Type.OBJECT,
        properties: {
            itemName: { type: Type.STRING },
            description: { type: Type.STRING },
            brand: { type: Type.STRING },
            estimatedValue: { type: Type.NUMBER },
            condition: { type: Type.STRING, enum: ['New', 'Like New', 'Used', 'For Parts'] },
            conditionDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceScore: { type: Type.NUMBER },
        },
        required: ['itemName', 'description', 'brand', 'estimatedValue', 'condition', 'conditionDetails', 'confidenceScore']
    };

    const addItemFunctionDeclaration: FunctionDeclaration = {
        name: 'addItemToInventory',
        description: 'Finalizes the appraisal and adds the identified item to the inventory list.',
        parameters: itemSchema
    };
    
    const updateItemFunctionDeclaration: FunctionDeclaration = {
        name: 'updateItemInInventory',
        description: 'Finalizes the review and updates the item with new information.',
        parameters: itemSchema
    }

    const handleStartSession = async () => {
        if (!capturedImage) {
            setStatusText('Please capture an image first.');
            return;
        }
        setIsSessionActive(true);
        setStatusText('Connecting to AI...');
        setTranscript([]);

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        const systemInstruction = itemToReview 
            ? `You are a friendly, conversational factory liquidation appraiser. We are reviewing an existing item: ${itemToReview.name}. The user has provided an image. Your job is to talk to the user to see if you can improve the item's details or valuation. Ask clarifying questions about its condition, brand, or any visible markings that might have been missed. Once you are confident you have improved the details, call the \`updateItemInInventory\` function with the new, complete information.`
            : "You are a friendly, conversational factory liquidation appraiser. The user has provided an image of an item. Your job is to talk to the user to identify it. Ask clarifying questions about its condition, brand, or any visible markings. Once you are confident you have all the necessary details, call the `addItemToInventory` function with the collected information.";

        const tools = [{ functionDeclarations: itemToReview ? [updateItemFunctionDeclaration] : [addItemFunctionDeclaration] }];

        try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction,
                    tools,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setStatusText('Connected! Start speaking now.');
                        const [header, data] = capturedImage.split(',');
                        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
                        sessionPromiseRef.current?.then(session => {
                            session.sendRealtimeInput({ media: { data, mimeType }});
                        });
                        mediaStreamSourceRef.current = inputAudioContextRef.current?.createMediaStreamSource(micStream);
                        scriptProcessorRef.current = inputAudioContextRef.current?.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current!.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length; const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                            const pcmBlob: GenAI_Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current!);
                        scriptProcessorRef.current!.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setTranscript(prev => {
                                const last = prev[prev.length -1];
                                if(last?.role === 'user') return [...prev.slice(0, -1), {role: 'user', text: last.text + message.serverContent.inputTranscription.text}];
                                return [...prev, {role: 'user', text: message.serverContent.inputTranscription.text}];
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                           setTranscript(prev => {
                                const last = prev[prev.length -1];
                                if(last?.role === 'model') return [...prev.slice(0, -1), {role: 'model', text: last.text + message.serverContent.outputTranscription.text}];
                                return [...prev, {role: 'model', text: message.serverContent.outputTranscription.text}];
                            });
                        }
                        if (message.toolCall?.functionCalls) {
                            const fc = message.toolCall.functionCalls[0];
                            if(fc.name === 'addItemToInventory') {
                                onAddItem({ ...fc.args, image: capturedImage, image2: null } as any);
                                handleEndSession();
                            } else if (fc.name === 'updateItemInInventory' && itemToReview) {
                                const updatedData = {
                                    ...itemToReview,
                                    ...fc.args,
                                    name: fc.args.itemName
                                };
                                delete updatedData.itemName;
                                onUpdateItem(updatedData);
                                handleEndSession();
                            }
                        }
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            const outputAudioContext = outputAudioContextRef.current!;
                            const nextStartTime = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.start(nextStartTime);
                            nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error(e);
                        if (e.message && (e.message.includes("API key not valid") || e.message.includes("API_KEY_INVALID"))) {
                            setError("Invalid API Key. Please check your environment configuration.");
                        } else {
                            setError('A connection error occurred with the AI service.');
                        }
                        handleEndSession();
                    },
                    onclose: () => {
                       micStream.getTracks().forEach(track => track.stop());
                    },
                }
            });
            setSession(await sessionPromiseRef.current);
        } catch (err) {
            console.error(err);
            setError("Could not access microphone. Please check permissions.");
            setIsSessionActive(false);
        }
    };

    const handleEndSession = () => {
        setIsSessionActive(false);
        setStatusText('Session ended.');
        session?.close();
        setSession(null);
        sessionPromiseRef.current = null;
        inputAudioContextRef.current?.close();
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        onClose();
    };
    
    const handleCapture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center z-50 p-4" onClick={handleEndSession}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex-grow flex flex-col md:flex-row min-h-0">
                    <div className="md:w-1/2 flex flex-col p-4 gap-4">
                        <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                             <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${capturedImage ? 'opacity-50' : 'opacity-100'}`} />
                             {capturedImage && <img src={capturedImage} alt="captured" className="absolute inset-0 w-full h-full object-contain"/>}
                             {cameraError && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80"><p className="text-red-400 p-4">{cameraError}</p></div>}
                             {!stream && !cameraError && <div className="absolute inset-0 flex items-center justify-center"><Loader /></div>}
                        </div>
                        <div className="flex-grow bg-slate-950/50 rounded-lg p-3 border border-slate-800 overflow-y-auto">
                            <h3 className="font-semibold text-slate-300 mb-2">Transcript</h3>
                            <div className="space-y-3 text-sm">
                                {transcript.map((entry, i) => (
                                    <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <p className={`px-3 py-2 rounded-lg max-w-[80%] ${entry.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>{entry.text}</p>
                                    </div>
                                ))}
                                {isSessionActive && transcript.length === 0 && <p className="text-slate-500 text-center">Waiting for conversation...</p>}
                            </div>
                        </div>
                    </div>
                    <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-slate-800/50">
                        <h2 className="text-2xl font-bold text-white mb-2">{itemToReview ? 'Live Item Review' : 'Live AI Appraisal'}</h2>
                        <p className="text-slate-400 mb-6">{statusText}</p>
                        
                        {!capturedImage ? (
                             <button onClick={handleCapture} className="w-24 h-24 rounded-full bg-white border-8 border-slate-500/50 flex flex-col items-center justify-center ring-4 ring-white/20 hover:ring-white/40 transition-all text-slate-800">
                                <CameraIcon className="w-10 h-10" />
                                <span className="text-xs font-semibold">Capture</span>
                             </button>
                        ): !isSessionActive ? (
                            <button onClick={handleStartSession} className="w-24 h-24 rounded-full bg-green-500 border-8 border-green-300/50 flex flex-col items-center justify-center ring-4 ring-green-500/20 hover:ring-green-500/40 transition-all text-white">
                                <MicIcon className="w-10 h-10" />
                                <span className="text-xs font-semibold">Start</span>
                             </button>
                        ) : (
                             <button onClick={handleEndSession} className="w-24 h-24 rounded-full bg-red-500 border-8 border-red-300/50 flex flex-col items-center justify-center ring-4 ring-red-500/20 hover:ring-red-500/40 transition-all text-white animate-pulse">
                                <MicIcon className="w-10 h-10" />
                                <span className="text-xs font-semibold">Stop</span>
                             </button>
                        )}
                        <button onClick={onClose} className="mt-8 px-6 py-2 rounded-lg text-slate-300 font-semibold hover:bg-slate-700 transition-colors">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveAppraisalModal;