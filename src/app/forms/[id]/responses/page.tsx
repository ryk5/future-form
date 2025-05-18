'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Question {
  id: string;
  type: 'text' | 'multiple-choice' | 'checkbox';
  question: string;
  required: boolean;
  options: string[];
}

interface Form {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface Response {
  id: string;
  form_id: string;
  answers: Record<string, string | string[]>;
  created_at: string;
}

export default function FormResponses({ params }: { params: { id: string } }) {
  const { id } = params;
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tableView, setTableView] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>(/* questionId -> value */ {});

  useEffect(() => {
    const fetchFormAndResponses = async () => {
      try {
        // Fetch form data
        const { data: formData, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', id)
          .single();

        if (formError) throw formError;
        setForm(formData);

        // Fetch all responses for this form
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select('*, user_id')
          .eq('form_id', id)
          .order('created_at', { ascending: false });

        if (responseError) throw responseError;
        setResponses(responseData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormAndResponses();
  }, [id]);

  function exportCSV() {
    if (!form || responses.length === 0) return;
    const headers = ['Date', ...form.questions.map((q) => q.question)];
    const rows = responses.map((response) => [
      new Date(response.created_at).toLocaleString(),
      ...form.questions.map((q) => {
        const ans = response.answers[q.id];
        return Array.isArray(ans) ? ans.join(', ') : ans || '';
      }),
    ]);
    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              typeof cell === 'string' && cell.includes(',')
                ? `"${cell.replace(/"/g, '""')}"`
                : cell
            )
            .join(',')
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title || 'responses'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCleanify(question: Question) {
    setCleaning(true);
    setShowDropdown(false);
    try {
      const values = responses.map(r => r.answers[question.id] || '');
      const prompt = `Given the following values for the column "${question.question}", normalize them (e.g., group synonyms, fix misspellings, infer intent). Return a JSON array of the cleaned values in the same order:\n\n${JSON.stringify(values)}`;
      
      const result = await fetch('/api/cleanify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }).then(res => res.json());

      // console.log('Cleanify API result:', result);

      if (!result.cleaned || !Array.isArray(result.cleaned)) {
        console.error('Invalid response from cleanify API:', result);
        throw new Error('Invalid response from cleanify API');
      }

      if (result.cleaned.length !== values.length) {
        console.error('Length mismatch between input and cleaned values:', {
          inputLength: values.length,
          cleanedLength: result.cleaned.length
        });
        throw new Error('Length mismatch in cleaned values');
      }

      const updatedResponses = responses.map((r, i) => ({
        ...r,
        answers: { ...r.answers, [question.id]: result.cleaned[i] }
      }));

      setResponses(updatedResponses);
        // console.log('Successfully updated responses with cleaned values');
    } catch (error) {
      console.error('Error in handleCleanify:', error);
      alert('Failed to clean the data. Please try again.');
    } finally {
      setCleaning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center flex-1 h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Loading responses...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center flex-1 h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Form not found</h2>
          </div>
        </div>
      </div>
    );
  }

  // Filter responses before rendering table
  const filteredResponses = tableView
    ? responses.filter(r =>
        form.questions.every(q => {
          const filterVal = filters[q.id];
          if (!filterVal) return true;
          const val = r.answers[q.id];
          return (Array.isArray(val) ? val.join(', ') : val || '') === filterVal;
        })
      )
    : responses;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{form.title} - Responses</h1>
          {form.description && (
            <p className="mt-2 text-base sm:text-lg text-gray-600">{form.description}</p>
          )}
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No responses yet</h3>
            <p className="mt-1 text-sm text-gray-500">Share your form to start collecting responses.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-6 items-center">
              <button
                className="bg-indigo-500 text-white px-4 py-2 rounded shadow hover:bg-indigo-600 w-full sm:w-auto"
                onClick={() => setTableView((v) => !v)}
              >
                {tableView ? 'Card View' : 'Table View'}
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 w-full sm:w-auto"
                onClick={exportCSV}
              >
                Export as CSV
              </button>
              <div className="relative w-full sm:w-auto">
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 w-full sm:w-auto"
                  onClick={() => setShowDropdown((v) => !v)}
                  disabled={cleaning}
                >
                  Cleanify ✨
                </button>
                {showDropdown && (
                  <div className="absolute z-10 mt-2 bg-white border rounded shadow w-full sm:w-48">
                    {form.questions.map((q) => (
                      <button
                        key={q.id}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
                        onClick={() => handleCleanify(q)}
                      >
                        {q.question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {cleaning && <span className="ml-2 text-yellow-600 animate-pulse">Cleaning...</span>}
            </div>

            {/* Filters for each column */}
            {tableView && (
              <div className="flex flex-wrap gap-4 mb-4">
                {form.questions.map((q) => {
                  const uniqueValues = Array.from(new Set(responses.map(r => {
                    const val = r.answers[q.id];
                    return Array.isArray(val) ? val.join(', ') : val || '';
                  }))).filter(v => v !== '');
                  return (
                    <div key={q.id} className="flex flex-col w-full sm:w-auto">
                      <label className="text-xs text-gray-600 mb-1">{q.question}</label>
                      <select
                        className="border rounded px-2 py-1 text-sm text-black w-full"
                        value={filters[q.id] || ''}
                        onChange={e => setFilters(f => ({ ...f, [q.id]: e.target.value }))}
                      >
                        <option value="">All</option>
                        {uniqueValues.map(v => (
                          <option key={v} value={v} className="text-black">{v}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {tableView ? (
              <div className="overflow-x-auto bg-white rounded shadow">
                <div className="min-w-full">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        {form.questions.map((q) => (
                          <th key={q.id} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {q.question}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResponses.map((response) => (
                        <tr key={response.id} className="border-t">
                          <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{new Date(response.created_at).toLocaleString()}</td>
                          {form.questions.map((q) => (
                            <td key={q.id} className="px-4 py-2 text-sm text-gray-700">
                              {Array.isArray(response.answers[q.id])
                                ? (response.answers[q.id] as string[]).join(', ')
                                : response.answers[q.id] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredResponses.map((response) => (
                  <div key={response.id} className="bg-white shadow rounded-lg p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">
                        Response from {new Date(response.created_at).toLocaleString()}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {form.questions.map((question) => (
                        <div key={question.id} className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-900">{question.question}</h4>
                          <div className="mt-2 text-sm text-gray-600">
                            {Array.isArray(response.answers[question.id]) ? (
                              <ul className="list-disc list-inside">
                                {(response.answers[question.id] as string[]).map((answer, index) => (
                                  <li key={index}>{answer}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>{response.answers[question.id] as string}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 