/**
 * Decision Coach - AI-powered decision training on Monad
 * 
 * README:
 * -------
 * How to run:
 *   npm install && npm run dev
 * 
 * Configure Monad contract:
 *   Update CONTRACT_ADDRESS below with your deployed contract address
 *   Update MONAD_CHAIN config with your RPC endpoint
 * 
 * Demo Mode:
 *   Toggle "Demo Mode" in the header to simulate blockchain interactions
 *   without requiring a wallet connection. Demo mode generates fake tx hashes
 *   and simulates confirmation states.
 * 
 * Contract ABI expected:
 *   function commit(bytes32 commitment, bool result) external
 */

import { useState, useEffect, useCallback } from 'react';
import { keccak256, encodePacked, type Address } from 'viem';
import { ArrowUp, ArrowDown, Brain, Target, MessageCircle, Shield, ExternalLink, Wallet, ToggleLeft, ToggleRight, Clock, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

// ============================================
// CONTRACT CONFIGURATION
// ============================================
const CONTRACT_ADDRESS: Address = '0x0000000000000000000000000000000000000000'; // TODO: Replace with deployed contract

const CONTRACT_ABI = [
  {
    name: 'commit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'commitment', type: 'bytes32' },
      { name: 'result', type: 'bool' },
    ],
    outputs: [],
  },
] as const;

// Monad Testnet Chain Config (placeholder)
const MONAD_CHAIN = {
  id: 10143, // Monad testnet chain ID - update if different
  name: 'Monad Testnet',
  rpcUrl: 'https://testnet-rpc.monad.xyz', // TODO: Update with actual RPC
};

// ============================================
// MOCK DATA
// ============================================
type Direction = 'UP' | 'DOWN';

interface AIAnalysis {
  direction: Direction;
  confidence: number;
  signals: string[];
  coachNote: string;
}

interface CoachResponse {
  feedback: string;
  patternInsight: string;
  nextSuggestion: string;
}

const mockAIAnalysis: AIAnalysis = {
  direction: 'UP',
  confidence: 78,
  signals: [
    'Order flow: bullish momentum detected',
    'RSI: neutral, no extreme readings',
    'Sentiment: slightly positive across channels',
    'Volume profile: above average accumulation',
  ],
  coachNote: 'This is analysis to inform your thinking, not a recommendation to follow.',
};

const coachResponses: Record<string, CoachResponse> = {
  'agree_correct': {
    feedback: "Your reasoning aligned with the analysis, and the outcome confirmed it. This is a good sign your pattern recognition is developing well. Stay curious about what signals felt most reliable to you.",
    patternInsight: "When you trust your read and it matches the data, you're building calibrated confidence.",
    nextSuggestion: "Next time, notice which specific signal gave you the most conviction.",
  },
  'agree_incorrect': {
    feedback: "You aligned with the analysis, but the outcome went the other way. This happens—markets are probabilistic, not deterministic. The goal isn't to be right every time, but to learn from each decision.",
    patternInsight: "Incorrect outcomes when following data are normal. What matters is your process was sound.",
    nextSuggestion: "Reflect on whether any signal felt uncertain. Trust that discomfort next time.",
  },
  'disagree_correct': {
    feedback: "You went against the analysis and were right. This shows independent thinking and perhaps pattern recognition the model missed. That's valuable—but also rare. Consider what you saw that the data didn't capture.",
    patternInsight: "Contrarian calls that work out often come from noticing something others overlooked.",
    nextSuggestion: "Document what gave you conviction to disagree. This insight could be your edge.",
  },
  'disagree_incorrect': {
    feedback: "You disagreed with the analysis, and the outcome didn't favor your call. That's okay—learning to calibrate when to trust your instincts versus the data is part of the training. Each decision teaches you something.",
    patternInsight: "Disagreeing with data isn't wrong, but it requires strong conviction backed by observation.",
    nextSuggestion: "Ask yourself: what made you doubt the analysis? Was it pattern or impulse?",
  },
};

// ============================================
// MAIN COMPONENT
// ============================================
const DecisionCoach = () => {
  // State
  const [demoMode, setDemoMode] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  const [userDirection, setUserDirection] = useState<Direction | null>(null);
  const [userConfidence, setUserConfidence] = useState(65);
  const [isLocked, setIsLocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timerActive, setTimerActive] = useState(true);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  const [outcome, setOutcome] = useState<Direction>('UP');
  const [showOutcome, setShowOutcome] = useState(false);
  
  const [commitmentHash, setCommitmentHash] = useState<string>('');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed'>('idle');
  const [txHash, setTxHash] = useState<string>('');

  // Timer logic
  useEffect(() => {
    if (!timerActive || isLocked) return;
    
    if (timeRemaining <= 0) {
      if (userDirection) {
        handleLockIn();
      } else {
        setShowTimeWarning(true);
        setTimerActive(false);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, timerActive, isLocked, userDirection]);

  // Compute commitment hash
  const computeCommitment = useCallback(() => {
    const address = demoMode ? '0xDemoUser' : (walletAddress || '0x0');
    const timestamp = Math.floor(Date.now() / 1000);
    
    try {
      const hash = keccak256(
        encodePacked(
          ['string', 'string', 'uint256', 'string', 'uint256', 'string', 'uint256'],
          [
            address,
            mockAIAnalysis.direction,
            BigInt(mockAIAnalysis.confidence),
            userDirection || 'NONE',
            BigInt(userConfidence),
            outcome,
            BigInt(timestamp),
          ]
        )
      );
      return hash;
    } catch {
      return '0x' + '0'.repeat(64);
    }
  }, [demoMode, walletAddress, userDirection, userConfidence, outcome]);

  useEffect(() => {
    if (isLocked && showOutcome) {
      setCommitmentHash(computeCommitment());
    }
  }, [isLocked, showOutcome, computeCommitment]);

  // Handlers
  const handleLockIn = () => {
    if (!userDirection) return;
    setIsLocked(true);
    setTimerActive(false);
    
    // Simulate outcome reveal after brief delay
    setTimeout(() => {
      setShowOutcome(true);
    }, 800);
  };

  const handleCommitProof = async () => {
    if (!commitmentHash) return;
    
    setTxStatus('pending');
    
    if (demoMode) {
      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const fakeTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setTxHash(fakeTxHash);
      setTxStatus('confirmed');
    } else {
      // Real transaction would go here
      // Using wagmi's writeContract hook in production
      try {
        // Placeholder for actual wagmi integration
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setTxStatus('confirmed');
      } catch {
        setTxStatus('idle');
      }
    }
  };

  const handleConnectWallet = () => {
    if (demoMode) {
      setDemoMode(false);
    }
    // In production, trigger wagmi connect modal
    setWalletConnected(true);
    setWalletAddress('0x1234...5678');
  };

  const handleRandomizeOutcome = () => {
    setOutcome((prev) => (prev === 'UP' ? 'DOWN' : 'UP'));
  };

  const resetDemo = () => {
    setUserDirection(null);
    setUserConfidence(65);
    setIsLocked(false);
    setTimeRemaining(30);
    setTimerActive(true);
    setShowTimeWarning(false);
    setShowOutcome(false);
    setCommitmentHash('');
    setTxStatus('idle');
    setTxHash('');
  };

  // Get coach feedback
  const getCoachFeedback = (): CoachResponse | null => {
    if (!showOutcome || !userDirection) return null;
    
    const agreed = userDirection === mockAIAnalysis.direction;
    const correct = userDirection === outcome;
    
    const key = `${agreed ? 'agree' : 'disagree'}_${correct ? 'correct' : 'incorrect'}`;
    return coachResponses[key];
  };

  const feedback = getCoachFeedback();
  const isCorrect = userDirection === outcome;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Decision Coach</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  AI trains your judgment. It doesn't replace it.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Demo Mode Toggle */}
              <button
                onClick={() => setDemoMode(!demoMode)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {demoMode ? (
                  <ToggleRight className="w-5 h-5 text-primary" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {demoMode ? 'Demo Mode' : 'Live Mode'}
                </span>
              </button>
              
              {/* Wallet Button */}
              <button
                onClick={handleConnectWallet}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <Wallet className="w-4 h-4" />
                {walletConnected ? walletAddress : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: AI Coach */}
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-4 h-4 text-primary" />
              <h2 className="panel-title mb-0">AI Coach</h2>
            </div>
            
            <div className="space-y-6">
              {/* Prediction */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Analysis Direction</p>
                  <div className="flex items-center gap-2 mt-1">
                    {mockAIAnalysis.direction === 'UP' ? (
                      <ArrowUp className="w-5 h-5 text-primary" />
                    ) : (
                      <ArrowDown className="w-5 h-5 text-primary" />
                    )}
                    <span className="stat-value">{mockAIAnalysis.direction}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="stat-label">Confidence</p>
                  <p className="stat-value mt-1">{mockAIAnalysis.confidence}%</p>
                </div>
              </div>
              
              {/* Confidence Bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${mockAIAnalysis.confidence}%` }}
                />
              </div>
              
              {/* Signals */}
              <div>
                <p className="stat-label mb-3">Signals</p>
                <div className="space-y-1">
                  {mockAIAnalysis.signals.map((signal, i) => (
                    <div key={i} className="signal-item">
                      <span className="signal-dot" />
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Coach Note */}
              <div className="feedback-block">
                <p className="text-xs text-muted-foreground italic">
                  {mockAIAnalysis.coachNote}
                </p>
              </div>
            </div>
          </div>
          
          {/* CENTER PANEL: Your Decision */}
          <div className="glass-card-elevated p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="panel-title mb-0">Your Decision</h2>
            </div>
            
            <div className="space-y-6">
              {/* Question */}
              <div className="text-center pb-4 border-b border-border/50">
                <p className="text-foreground font-medium">
                  Will BTC move <span className="text-primary">UP</span> or <span className="text-primary">DOWN</span> in the next 30 minutes?
                </p>
              </div>
              
              {/* Timer */}
              <div className="flex items-center justify-center gap-2">
                <Clock className={`w-4 h-4 ${timeRemaining <= 10 ? 'text-warning animate-pulse' : 'text-muted-foreground'}`} />
                <span className={`font-mono text-lg ${timeRemaining <= 10 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {isLocked ? 'Locked' : `${timeRemaining}s`}
                </span>
              </div>
              
              {showTimeWarning && !userDirection && (
                <p className="text-center text-sm text-warning">
                  Time's up — please make a selection to continue.
                </p>
              )}
              
              {/* Direction Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => !isLocked && setUserDirection('UP')}
                  disabled={isLocked}
                  className={`decision-button ${userDirection === 'UP' ? 'decision-button-selected' : ''} ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <ArrowUp className="w-6 h-6 mx-auto mb-1" />
                  UP
                </button>
                <button
                  onClick={() => !isLocked && setUserDirection('DOWN')}
                  disabled={isLocked}
                  className={`decision-button ${userDirection === 'DOWN' ? 'decision-button-selected' : ''} ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <ArrowDown className="w-6 h-6 mx-auto mb-1" />
                  DOWN
                </button>
              </div>
              
              {/* Confidence Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="stat-label">Your Confidence</span>
                  <span className="text-lg font-semibold text-primary">{userConfidence}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={userConfidence}
                  onChange={(e) => !isLocked && setUserConfidence(Number(e.target.value))}
                  disabled={isLocked}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
              
              {/* Lock In Button */}
              {!isLocked ? (
                <button
                  onClick={handleLockIn}
                  disabled={!userDirection}
                  className={`w-full coach-button-primary ${!userDirection ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Lock In Decision
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-success/20 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Decision Locked</span>
                </div>
              )}
              
              {/* Reset Button (for demo) */}
              {isLocked && (
                <button
                  onClick={resetDemo}
                  className="w-full coach-button-ghost text-sm"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Start New Session
                </button>
              )}
            </div>
          </div>
          
          {/* RIGHT PANEL: Feedback */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h2 className="panel-title mb-0">Feedback</h2>
            </div>
            
            {!showOutcome ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Make your decision to receive personalized feedback from your coach.
                </p>
              </div>
            ) : (
              <div className="space-y-5 animate-slide-up">
                {/* Outcome */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                  <span className="stat-label">Outcome</span>
                  <div className="flex items-center gap-2">
                    {outcome === 'UP' ? (
                      <ArrowUp className="w-5 h-5 text-primary" />
                    ) : (
                      <ArrowDown className="w-5 h-5 text-primary" />
                    )}
                    <span className="font-semibold text-foreground">{outcome}</span>
                  </div>
                </div>
                
                {/* Demo: Randomize Outcome */}
                {demoMode && (
                  <button
                    onClick={handleRandomizeOutcome}
                    className="w-full coach-button-ghost text-xs"
                  >
                    <RefreshCw className="w-3 h-3 inline mr-1" />
                    Toggle Outcome (Demo)
                  </button>
                )}
                
                {/* Performance Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="feedback-block text-center">
                    <p className="stat-label mb-1">Direction</p>
                    <p className={`font-medium ${isCorrect ? 'text-success' : 'text-muted-foreground'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </p>
                  </div>
                  <div className="feedback-block text-center">
                    <p className="stat-label mb-1">Confidence</p>
                    <p className="font-medium text-muted-foreground">
                      {userConfidence > 70 ? 'High' : userConfidence > 40 ? 'Moderate' : 'Low'}
                    </p>
                  </div>
                </div>
                
                {/* Coach Feedback */}
                {feedback && (
                  <>
                    <div className="feedback-block">
                      <p className="text-sm text-foreground leading-relaxed">
                        {feedback.feedback}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="stat-label mb-1">Pattern Insight</p>
                        <p className="text-sm text-muted-foreground">{feedback.patternInsight}</p>
                      </div>
                      <div>
                        <p className="stat-label mb-1">Next Focus</p>
                        <p className="text-sm text-muted-foreground">{feedback.nextSuggestion}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* BOTTOM BAR: On-chain Proof */}
        <div className="glass-card p-5 mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="panel-title mb-0">On-chain Proof (Monad)</h2>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-8">
              {/* Commitment Hash */}
              <div className="flex-1">
                <p className="stat-label mb-1">Commitment Hash</p>
                <p className="font-mono text-sm text-muted-foreground truncate">
                  {commitmentHash || '—'}
                </p>
              </div>
              
              {/* Status */}
              <div>
                <p className="stat-label mb-1">Status</p>
                {txStatus === 'idle' && (
                  <span className="status-idle">Not committed</span>
                )}
                {txStatus === 'pending' && (
                  <span className="status-pending">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Pending
                  </span>
                )}
                {txStatus === 'confirmed' && (
                  <span className="status-confirmed">
                    <CheckCircle2 className="w-3 h-3" />
                    Confirmed
                  </span>
                )}
              </div>
              
              {/* Tx Hash */}
              {txHash && (
                <div>
                  <p className="stat-label mb-1">Transaction</p>
                  <a
                    href={`https://explorer.monad.xyz/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline font-mono"
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            
            {/* Commit Button */}
            <div>
              <button
                onClick={handleCommitProof}
                disabled={!commitmentHash || txStatus === 'pending' || txStatus === 'confirmed' || (!demoMode && !walletConnected)}
                className={`coach-button-primary flex items-center gap-2 ${
                  (!commitmentHash || txStatus === 'pending' || txStatus === 'confirmed' || (!demoMode && !walletConnected))
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {txStatus === 'pending' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Committing...
                  </>
                ) : txStatus === 'confirmed' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Committed
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Commit Proof to Monad
                  </>
                )}
              </button>
              {!demoMode && !walletConnected && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Connect wallet to commit
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            Decision Coach — Training your judgment, one decision at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DecisionCoach;
