import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AudioCoach } from '../services/audioCoach';
import { UserProfile, WorkoutSessionRecord } from '../types';

interface AiCoachPageProps {
  userProfile: UserProfile;
  workoutHistory: WorkoutSessionRecord[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiCoachPage: React.FC<AiCoachPageProps> = ({
  userProfile,
  workoutHistory
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `Hello ${userProfile.name || 'Athlete'}! I am your FitVision AI Coach. I analyze your 60 FPS biometric joint tracking, manage your workout volume, and design nutrition protocols calibrated to your ${userProfile.primaryGoal.replace('_', ' ')} goal.\n\nAsk me anything about movement biomechanics, tempo, form corrections, or nutrition!`,
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechActive, setSpeechActive] = useState(AudioCoach.isEnabled());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    'Why is knee valgus (cave) dangerous in squats?',
    'What is the optimal eccentric tempo for chest hypertrophy?',
    'Suggest a 40g vegetarian protein meal using Indian staples',
    'How do I fix lower back rounding on deadlifts?',
    'How much rest between sets for maximum strength?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          userProfile,
          recentWorkouts: workoutHistory.slice(0, 3)
        })
      });

      const data = await response.json();
      const replyText = data.reply || 'Focus on controlled tempo and form alignment.';

      const coachMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, coachMsg]);

      // Speak response aloud if speech is enabled
      if (speechActive) {
        // Speak first 2 sentences for concise audio cue
        const shortAudioCue = replyText.split('.').slice(0, 2).join('.') + '.';
        AudioCoach.speak(shortAudioCue);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content:
            'I am currently operating in offline mode. For full AI reasoning, ensure your GEMINI_API_KEY is configured in Settings. Remember to always brace your core and control your eccentric lowering!',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Web Speech Recognition for voice input
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        AudioCoach.playTone(520, 0.1);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error', err);
      setIsListening(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Bot className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span>FitVision AI Conversational Coach</span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                Gemini 3.8
              </span>
            </h1>
            <p className="text-xs text-neutral-400">
              Real-time voice & text coaching grounded in joint kinematics and sports science
            </p>
          </div>
        </div>

        {/* Voice Speech Toggle */}
        <button
          onClick={() => {
            const next = !speechActive;
            setSpeechActive(next);
            AudioCoach.setEnabled(next);
          }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            speechActive
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-neutral-800 bg-neutral-900 text-neutral-400'
          }`}
        >
          {speechActive ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span>{speechActive ? 'Voice Audio: On' : 'Voice Audio: Off'}</span>
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs text-neutral-300 hover:border-emerald-500/40 hover:text-white transition-colors text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <div className="h-[480px] rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 sm:p-6 overflow-y-auto space-y-4 shadow-xl">
        {messages.map((msg) => {
          const isCoach = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isCoach ? 'justify-start' : 'justify-end'}`}
            >
              {isCoach && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isCoach
                    ? 'border border-neutral-800 bg-neutral-900 text-neutral-200'
                    : 'bg-emerald-500 text-neutral-950 font-medium'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <span
                  className={`block mt-2 text-[10px] font-mono ${
                    isCoach ? 'text-neutral-500' : 'text-neutral-800'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {!isCoach && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200 flex-shrink-0 mt-0.5 font-bold text-xs">
                  {userProfile.name ? userProfile.name.charAt(0) : 'U'}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-3 text-xs text-neutral-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>Coach is analyzing movement biomechanics...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Mic */}
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleListening}
          id="mic-voice-btn"
          title={isListening ? 'Listening... click to stop' : 'Click to speak to coach'}
          className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
            isListening
              ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse'
              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <input
          id="ai-coach-input"
          type="text"
          placeholder={isListening ? 'Listening to your voice...' : 'Ask your AI coach anything about form, technique, or nutrition...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
        />

        <button
          id="ai-coach-send-btn"
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputText.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-neutral-500 text-center">
        FitVision AI Coach offers movement technique cues and nutrition estimates. It is not medical or physical therapy advice. Consult a physician if experiencing persistent pain.
      </p>
    </div>
  );
};
