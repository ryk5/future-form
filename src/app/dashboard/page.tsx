'use client';

import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Form {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}

export default function DashboardPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    // Check user authentication
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) return;
      // Fetch forms from Supabase
      supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching forms:', error);
            setForms([]);
          } else {
            setForms(data || []);
          }
        });
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) return;
      supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching forms:', error);
            setForms([]);
          } else {
            setForms(data || []);
          }
        });
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) return;
    const { error } = await supabase.from('forms').delete().eq('id', formId);
    if (!error) {
      setForms(forms => forms.filter(f => f.id !== formId));
    } else {
      console.error('Supabase delete error:', error);
      alert('Failed to delete form: ' + (error.message || 'Unknown error'));
    }
  };

  if (user === undefined) {
    // Still loading, show a spinner or nothing
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    // Not logged in, show the login form
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : ''}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Forms</h1>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Create Form
            </button>
          </div>

          {forms.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new form.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      <a href={`/forms/${form.id}`} className="focus:outline-none hover:underline">
                        {form.title}
                      </a>
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      <a href={`/forms/${form.id}`} className="focus:outline-none hover:underline">
                        {form.description}
                      </a>
                    </p>
                  </div>
                  <button
                    className="ml-4 text-red-500 hover:text-red-700 font-semibold text-xs border border-red-200 rounded px-2 py-1 transition"
                    onClick={() => handleDelete(form.id)}
                    title="Delete form"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 