import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { sendMessageToGemini, parseWorkoutFromResponse } from '../utils/gemini';
import { getWeeklyWorkouts, saveWeeklyWorkouts } from '../utils/storage';
import { Send, Key, Dumbbell, Zap, Waves, Check, Plus, AlertCircle, Bot, User } from 'lucide-react';
import { Link } from 'gatsby';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá, Edgar! Sou o Arena AI, seu assistente de treino virtual. 🏋️‍♂️\n\nPosso te ajudar a tirar dúvidas sobre exercícios, sugerir corridas ou rotinas de natação, e montar treinos personalizados. Me diga, qual é o foco de hoje?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parsed workouts state (stores parsed workouts mapped to message IDs)
  const [parsedWorkouts, setParsedWorkouts] = useState({});
  const [importTargetDays, setImportTargetDays] = useState({});
  const [importSuccess, setImportSuccess] = useState({});

  const messagesEndRef = useRef(null);

  // Load API key from local storage or environment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const localKey = localStorage.getItem('arena_gemini_key') || '';
    const envKey = process.env.GATSBY_GEMINI_API_KEY || '';
    setApiKey(localKey || envKey);
    if (!localKey && !envKey) {
      setShowKeyForm(true); // remind user if no key found
    }
  }, []);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('arena_gemini_key', apiKey);
      setShowKeyForm(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!apiKey) {
      setError('Por favor, configure sua chave de API do Gemini para conversar.');
      setShowKeyForm(true);
      return;
    }

    const userMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);
    setError('');

    try {
      const historyToSend = [...messages, userMessage].map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const aiResponseText = await sendMessageToGemini(historyToSend, apiKey);

      // Clean AI response text from XML tags to show a clean message to the user
      const cleanResponseText = aiResponseText.replace(/<workout_json>[\s\S]*?<\/workout_json>/gi, '').trim();

      const aiMessageId = Math.random().toString(36).substr(2, 9);
      const aiMessage = {
        id: aiMessageId,
        sender: 'ai',
        text: cleanResponseText || 'Aqui está o seu treino sugerido:'
      };

      setMessages(prev => [...prev, aiMessage]);

      // Check if response contains a workout structure
      const parsedWorkout = parseWorkoutFromResponse(aiResponseText);
      if (parsedWorkout) {
        setParsedWorkouts(prev => ({
          ...prev,
          [aiMessageId]: parsedWorkout
        }));
        setImportTargetDays(prev => ({
          ...prev,
          [aiMessageId]: parsedWorkout.day || 'Segunda'
        }));
      }
    } catch (err) {
      console.error(err);
      setError(`Erro ao enviar mensagem: ${err.message || 'Verifique sua chave de API.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportWorkout = (msgId) => {
    const workout = parsedWorkouts[msgId];
    const targetDay = importTargetDays[msgId] || 'Segunda';
    if (!workout) return;

    try {
      const currentWorkouts = getWeeklyWorkouts();
      
      // Map AI exercises into our application schema
      const newExercises = workout.exercises.map(ex => ({
        id: Math.random().toString(36).substr(2, 9),
        name: ex.name,
        type: ex.type,
        ...(ex.type === 'musculacao' ? {
          targetSets: parseInt(ex.targetSets) || 4,
          targetReps: parseInt(ex.targetReps) || 10,
          targetWeight: parseFloat(ex.targetWeight) || 0
        } : {
          targetDistance: parseFloat(ex.targetDistance) || 0,
          targetDuration: parseInt(ex.targetDuration) || 30
        })
      }));

      const updatedWorkouts = {
        ...currentWorkouts,
        [targetDay]: [...(currentWorkouts[targetDay] || []), ...newExercises]
      };

      saveWeeklyWorkouts(updatedWorkouts);
      
      setImportSuccess(prev => ({
        ...prev,
        [msgId]: `Treino importado com sucesso para ${targetDay}! 🎉`
      }));
    } catch (err) {
      console.error(err);
      setError('Erro ao importar treino.');
    }
  };

  const getSportIcon = (type) => {
    switch(type) {
      case 'musculacao': return <Dumbbell size={14} color="var(--color-musculacao)" />;
      case 'corrida': return <Zap size={14} color="var(--color-corrida)" />;
      case 'natacao': return <Waves size={14} color="var(--color-natacao)" />;
      default: return null;
    }
  };

  const formatText = (text) => {
    return text.split('\n').map((line, idx) => (
      <span key={idx}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <Layout activePage="/chat">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        
        {/* Chat Main Window */}
        <div className="glass-card" style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '0',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--card-border)',
            background: 'rgba(255, 255, 255, 0.01)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Arena AI Assistant</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Online</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowKeyForm(!showKeyForm)}
              style={{
                background: 'transparent',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Key size={14} /> Chave API
            </button>
          </div>

          {/* Config Key Form Drawer */}
          {showKeyForm && (
            <div style={{
              background: 'rgba(0,0,0,0.02)',
              borderBottom: '1px solid var(--card-border)',
              padding: '15px 20px',
              animation: 'slideUp 0.3s ease-out'
            }}>
              <form onSubmit={handleSaveKey} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="password"
                    required
                    placeholder="Cole sua Gemini API Key do Google AI Studio..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      background: 'var(--bg-primary)', border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                  Salvar Chave
                </button>
              </form>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Obtenha uma chave grátis no <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-gold)', textDecoration: 'underline' }}>Google AI Studio</a>. Chaves são salvas localmente no navegador de forma segura.
              </p>
            </div>
          )}

          {/* Messages Viewport */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(0,0,0,0.01)'
          }}>
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              const hasWorkout = parsedWorkouts[msg.id];
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isAi ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    alignSelf: isAi ? 'flex-start' : 'flex-end'
                  }}
                >
                  {/* Bubble */}
                  <div style={{
                    background: isAi ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)',
                    color: isAi ? 'var(--text-primary)' : '#0f172a',
                    padding: '12px 18px',
                    borderRadius: isAi ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                    border: isAi ? '1px solid var(--card-border)' : 'none',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                  }}>
                    {formatText(msg.text)}
                  </div>

                  {/* Workout Importer Assistant Card */}
                  {isAi && hasWorkout && (
                    <div className="glass-card glow-gold animate-slide-up" style={{
                      marginTop: '12px',
                      background: 'var(--bg-secondary)',
                      width: '100%',
                      minWidth: '280px',
                      maxWidth: '360px',
                      padding: '15px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Dumbbell size={16} color="var(--color-gold)" />
                        <h4 style={{ fontSize: '13px', fontWeight: '700' }}>Treino Sugerido Encontrado!</h4>
                      </div>

                      {/* Workout preview list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                        {hasWorkout.exercises.map((ex, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {getSportIcon(ex.type)} {ex.name}
                            </span>
                            <span>
                              {ex.type === 'musculacao' && `${ex.targetSets}s × ${ex.targetReps}r (${ex.targetWeight}kg)`}
                              {ex.type === 'corrida' && `${ex.targetDistance}km / ${ex.targetDuration}m`}
                              {ex.type === 'natacao' && `${ex.targetDistance}m / ${ex.targetDuration}m`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Importer Form */}
                      {!importSuccess[msg.id] ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={importTargetDays[msg.id] || 'Segunda'}
                            onChange={(e) => {
                              const day = e.target.value;
                              setImportTargetDays(prev => ({ ...prev, [msg.id]: day }));
                            }}
                            style={{
                              flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--bg-primary)',
                              border: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '12px',
                              outline: 'none', cursor: 'pointer'
                            }}
                          >
                            <option value="Segunda">Segunda</option>
                            <option value="Terça">Terça</option>
                            <option value="Quarta">Quarta</option>
                            <option value="Quinta">Quinta</option>
                            <option value="Sexta">Sexta</option>
                            <option value="Sábado">Sábado</option>
                            <option value="Domingo">Domingo</option>
                          </select>
                          <button
                            onClick={() => handleImportWorkout(msg.id)}
                            className="btn-primary"
                            style={{ padding: '8px 12px', fontSize: '12px', gap: '4px' }}
                          >
                            <Plus size={12} /> Salvar Treino
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                          color: 'var(--color-success)', padding: '8px 12px', borderRadius: '8px',
                          fontSize: '11px', fontWeight: '700', textAlign: 'center'
                        }}>
                          {importSuccess[msg.id]}
                          <Link to="/plan" style={{ display: 'block', color: 'var(--color-gold)', marginTop: '4px', textDecoration: 'underline' }}>
                            Ver no Planejador 📅
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--card-border)',
                  padding: '12px 18px',
                  borderRadius: '16px 16px 16px 4px',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'pop 0.6s infinite alternate' }}></span>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'pop 0.6s infinite alternate 0.2s' }}></span>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: 'pop 0.6s infinite alternate 0.4s' }}></span>
                </div>
              </div>
            )}

            {/* Error notifications */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--color-danger)', padding: '12px 18px', borderRadius: '12px',
                fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center',
                maxWidth: '90%'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Message Input Footer */}
          <div style={{
            padding: '15px 20px',
            borderTop: '1px solid var(--card-border)',
            background: 'rgba(255,255,255,0.01)'
          }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                disabled={loading}
                placeholder={loading ? 'Arena AI está gerando o treino...' : 'Escreva sua dúvida ou peça um treino (ex: "monte um treino de corrida para terça")'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: '10px',
                  background: 'var(--bg-primary)', border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="btn-primary"
                style={{
                  width: '48px', height: '48px', padding: '0', borderRadius: '10px',
                  justifyContent: 'center', cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !inputText.trim() ? 0.6 : 1
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default ChatPage;
