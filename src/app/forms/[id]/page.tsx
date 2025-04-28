'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  type: 'text' | 'multiple-choice' | 'checkbox';
  question: string;
  required: boolean;
  options: string[];
}

export default function FormEditor({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setTitle(data.title);
          setDescription(data.description);
          setQuestions(data.questions);
          setIsPublished(true);
        }
      } catch (error) {
        console.error('Error fetching form:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      question: '',
      required: false,
      options: [],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: [...q.options, ''] }
          : q
      )
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((_, index) => index !== optionIndex),
            }
          : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, index) =>
                index === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const handlePublish = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to publish a form.');
        return;
      }
      const { error } = await supabase
        .from('forms')
        .upsert([
          {
            id,
            title,
            description,
            questions,
            user_id: user.id,
          },
        ]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      setIsPublished(true);
    } catch (error) {
      console.error('Error publishing form:', error);
      alert('There was an error publishing your form. Please try again.');
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/forms/${id}/submit`;
    navigator.clipboard.writeText(link);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Loading form...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full text-3xl font-bold border-0 border-b border-gray-300 focus:ring-0 focus:border-indigo-500 text-black placeholder-gray-400"
                placeholder="Untitled Form"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 block w-full text-lg border-0 border-b border-gray-300 focus:ring-0 focus:border-indigo-500 text-black placeholder-gray-400"
                placeholder="Form Description"
              />
            </div>

            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <div className="flex justify-between items-start">
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(question.id, { question: e.target.value })
                      }
                      className="block w-full text-lg font-medium border-0 border-b border-gray-300 focus:ring-0 focus:border-indigo-500 text-black placeholder-gray-400"
                      placeholder="New Question"
                    />
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="ml-2 text-gray-400 hover:text-gray-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <select
                      value={question.type}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          type: e.target.value as Question['type'],
                          options: e.target.value === 'text' ? [] : question.options,
                        })
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
                    >
                      <option value="text">Short Answer</option>
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            required: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        Required
                      </span>
                    </label>
                  </div>

                  {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-700">Options</h4>
                        <button
                          onClick={() => addOption(question.id)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <PlusIcon className="-ml-1 mr-1 h-4 w-4" aria-hidden="true" />
                          Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {question.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, index, e.target.value)}
                              className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black placeholder-gray-400 px-3 py-2"
                              placeholder={`Option ${index + 1}`}
                            />
                            <button
                              onClick={() => removeOption(question.id, index)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={addQuestion}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Question
              </button>

              <div className="flex space-x-4">
                {isPublished && (
                  <a
                    href={`/forms/${id}/responses`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Responses
                  </a>
                )}

                {!isPublished ? (
                  <button
                    onClick={handlePublish}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Publish Form
                  </button>
                ) : (
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <LinkIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    {showCopied ? 'Copied!' : 'Copy Link'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 