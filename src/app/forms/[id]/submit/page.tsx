'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import happybot from '@/images/happybot.png';
import confusedbot from '@/images/confusedbot.png';

// Add this style for hover animation (can be in a <style jsx> or global CSS, but here as a class for simplicity)
const hoverAnim = "animate-[updown_1.5s_ease-in-out_infinite]";

export default function FormSubmitPage() {
  const params = useParams();
  const formId = params?.id as string;
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      const { data, error } = await supabase
        .from('forms')
        .select('questions')
        .eq('id', formId)
        .maybeSingle();

      if (error) {
        // handle error (show message, etc)
        setQuestions([]);
      } else {
        setQuestions(data?.questions || []);
      }
      setLoading(false);
    }
    if (formId) fetchQuestions();
  }, [formId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!questions || questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">No questions found for this form.</div>;
  }

  return <ChatForm questions={questions} />;
}

function ChatForm({ questions }: { questions: any[] }) {
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const formId = params?.id as string;

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, showSummary, submitted]);

  // Initialize first question
  useEffect(() => {
    if (messages.length === 0 && questions.length > 0) {
      setMessages([{ role: 'bot', text: questions[0].question }]);
    }
  }, [questions, messages.length]);

  // Handle answer submission with thinking bubble
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showSummary) return;
    if (editIndex !== null) {
      const updated = [...responses];
      updated[editIndex] = { questionId: questions[editIndex].id, answer: input };
      setResponses(updated);
      setEditIndex(null);
      setCurrent(questions.length); // Go back to summary
      setShowSummary(true);
      setInput('');
      // Update messages: replace the user message for that question
      setMessages(prev => {
        // Remove all summary messages
        const newMsgs = prev.filter(m => !m.summary);
        // Find the user message index for this question (bot+user pairs)
        let userMsgIdx = -1;
        for (let i = 0; i < newMsgs.length; i++) {
          if (newMsgs[i].role === 'bot' && newMsgs[i].text === questions[editIndex].question) {
            userMsgIdx = i + 1;
            break;
          }
        }
        if (userMsgIdx !== -1 && newMsgs[userMsgIdx]?.role === 'user') {
          newMsgs[userMsgIdx] = { role: 'user', text: input };
        }
        // Always append a single summary message at the end
        return [
          ...newMsgs,
          {
            role: 'bot',
            text: 'Please review your answers below. If you want to change any, click Edit. When you\'re ready, click Confirm & Submit.',
            summary: true
          }
        ];
      });
      return;
    }
    if (!input.trim()) return;
    // Add user message and thinking bubble
    setMessages(prev => [
      ...prev,
      { role: 'user', text: input },
      { role: 'bot', thinking: true }
    ]);
    setResponses(prev => [...prev, { questionId: questions[current].id, answer: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => {
        // Remove the last thinking bubble and add the next question or summary
        const withoutThinking = prev.filter((msg, idx) => !(idx === prev.length - 1 && msg.thinking));
        if (current + 1 < questions.length) {
          return [
            ...withoutThinking,
            { role: 'bot', text: questions[current + 1].question }
          ];
        } else {
          setShowSummary(true);
          return [
            ...withoutThinking,
            {
              role: 'bot',
              text: 'Please review your answers below. If you want to change any, click Edit. When you\'re ready, click Confirm & Submit.',
              summary: true
            }
          ];
        }
      });
      setCurrent(prev => prev + 1);
    }, 1000);
  };

  // Handle edit from summary
  const handleEdit = (i: number) => {
    setEditIndex(i);
    setCurrent(i);
    setShowSummary(false);
    setInput(Array.isArray(responses[i]?.answer) ? responses[i]?.answer.join(', ') : responses[i]?.answer || '');
    
    // Update messages to show the question being edited
    setMessages(prev => {
      // Remove all summary messages
      const newMsgs = prev.filter(m => !m.summary);
      // Add the question being edited
      return [
        ...newMsgs,
        { role: 'bot', text: questions[i].question }
      ];
    });
  };

  // Handle confirm & submit
  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to submit a response.');
      setSubmitting(false);
      return;
    }
    const answers = responses.reduce((acc, r) => {
      acc[r.questionId] = r.answer;
      return acc;
    }, {} as Record<string, any>);
    const { error } = await supabase.from('responses').insert([
      {
        form_id: formId,
        answers,
        user_id: user.id,
      },
    ]);
    setSubmitting(false);
    if (error) {
      setError('There was an error submitting your response. Please try again.');
    } else {
      setSubmitted(true);
      setShowSummary(false);
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: '🎉 Thank you for completing the form!' }
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-indigo-100 flex flex-col h-[600px]">
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col justify-end space-y-4">
          {messages.map((msg, idx) => {
            if (msg.role === 'bot') {
              if (msg.thinking) {
                return (
                  <div key={idx} className="flex items-end">
                    <Image src={confusedbot} alt="Thinking Bot" width={40} height={40} className={`rounded-full mr-2 ${hoverAnim}`} />
                    <div className="bg-indigo-100 text-indigo-900 p-3 rounded-2xl rounded-bl-none shadow max-w-[70%] flex items-center">
                      <span className="text-2xl animate-pulse">...</span>
                    </div>
                  </div>
                );
              }
              if (msg.summary) {
                // Render summary as a chat message
                return (
                  <div key={idx} className="flex items-start">
                    <Image src={happybot} alt="Bot" width={40} height={40} className={`rounded-full mr-2 ${hoverAnim}`} />
                    <div className="bg-indigo-100 text-indigo-900 p-3 rounded-2xl rounded-bl-none shadow max-w-[70%]">
                      <div className="mb-2">{msg.text}</div>
                      <div className="space-y-2">
                        {questions.map((q, i) => (
                          <div key={q.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-indigo-50">
                            <div>
                              <div className="font-semibold text-indigo-800">{q.question}</div>
                              <div className="text-gray-700 text-sm">
                                {Array.isArray(responses[i]?.answer)
                                  ? responses[i]?.answer.join(', ')
                                  : responses[i]?.answer}
                              </div>
                            </div>
                            <button
                              className="ml-2 text-indigo-500 hover:text-indigo-700 underline text-xs"
                              onClick={() => handleEdit(i)}
                              type="button"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col items-start mt-4">
                        <button
                          className="bg-indigo-500 text-white px-4 py-2 rounded-full shadow hover:bg-indigo-600 text-sm font-semibold mb-2"
                          onClick={handleConfirm}
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting...' : '✅ Confirm & Submit'}
                        </button>
                        {error && <div className="text-red-500 mt-2">{error}</div>}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={idx} className="flex items-end">
                  <Image src={happybot} alt="Bot" width={40} height={40} className={`rounded-full mr-2 ${hoverAnim}`} />
                  <div className="bg-indigo-100 text-indigo-900 p-3 rounded-2xl rounded-bl-none shadow max-w-[70%]">
                    {msg.text}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={idx} className="flex items-end justify-end">
                  <div className="bg-green-100 text-green-900 p-3 rounded-2xl rounded-br-none shadow max-w-[70%]">
                    {msg.text}
                  </div>
                </div>
              );
            }
          })}
          <div ref={chatBottomRef} />
        </div>
        {/* Input bar (show if not summary, not submitted, and either editing or answering a new question) */}
        {!showSummary && !submitted && (editIndex !== null || current < questions.length) && (
          <form
            onSubmit={handleSend}
            className="flex items-center border-t border-gray-200 p-3 bg-white"
          >
            <input
              name="answer"
              className="flex-1 border border-indigo-300 rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-black placeholder-gray-400"
              autoFocus
              placeholder="Type your answer..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-indigo-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-600 shadow"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Update CheckboxQuestion for a more fun style
function CheckboxQuestion({ options, onSubmit }: { options: string[]; onSubmit: (a: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(selected);
        setSelected([]);
      }}
      className="flex flex-col gap-2 w-full items-end"
    >
      <div className="flex flex-wrap gap-2 w-full justify-end">
        {options.map(opt => (
          <label key={opt} className="flex items-center bg-indigo-50 px-3 py-2 rounded-full shadow border border-indigo-100 cursor-pointer hover:bg-indigo-100">
            <input
              type="checkbox"
              value={opt}
              checked={selected.includes(opt)}
              onChange={e => {
                if (e.target.checked) setSelected([...selected, opt]);
                else setSelected(selected.filter(o => o !== opt));
              }}
              className="mr-2 accent-indigo-500"
            />
            {opt}
          </label>
        ))}
      </div>
      <button type="submit" className="bg-indigo-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-600 shadow mt-2">Send</button>
    </form>
  );
}

// Add the keyframes for updown animation (in global CSS or a <style jsx global>):
/*
@keyframes updown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
*/ 