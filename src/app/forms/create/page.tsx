"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Question {
  id: string;
  type: 'text' | 'multiple-choice' | 'checkbox';
  question: string;
  required: boolean;
  options: string[];
}

export default function CreateFormPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    if (!title.trim()) {
      alert('Please enter a form title.');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question before publishing.');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be logged in to publish a form.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('forms')
      .insert([
        {
          title,
          description,
          questions,
          user_id: user.id,
        },
      ])
      .select()
      .single();
    setLoading(false);
    if (error) {
      alert('Error publishing form: ' + error.message);
    } else {
      router.push(`/forms/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-indigo-100 p-8">
        <h1 className="text-2xl text-indigo-600 font-bold mb-4">Create a New Form</h1>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full text-3xl font-bold border-0 border-b border-gray-300 focus:ring-0 focus:border-indigo-500 text-black placeholder-gray-400 mb-2"
          placeholder="Untitled Form"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 block w-full text-lg border-0 border-b border-gray-300 focus:ring-0 focus:border-indigo-500 text-black placeholder-gray-400 mb-6"
          placeholder="Form Description"
        />
        <div className="space-y-4 mb-8">
          {questions.map((question) => (
            <div
              key={question.id}
              className="bg-gray-50 p-4 rounded-lg shadow"
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
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Question
          </button>
          <button
            onClick={handlePublish}
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={loading}
          >
            {loading ? 'Publishing...' : 'Publish Form'}
          </button>
        </div>
      </div>
    </div>
  );
} 