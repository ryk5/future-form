import Link from 'next/link';
import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl md:text-6xl font-bold text-indigo-600 text-center mb-6">
        <span className="typed-motto">Making Forms Fun</span>
      </h1>
      <p className="text-lg md:text-2xl text-gray-700 text-center max-w-2xl mb-4">
        <br></br>
        Welcome to FutureForm!<br />
        <span className="font-semibold">Features:</span>
      </p>
      <ul className="list-disc list-inside text-left mt-2 mb-8">
        <li className="text-black">Conversational, chat-style form filling</li>
        <li className="text-black">Real-time answer editing and review</li>
        <li className="text-black">Modern, playful UI with animated bots</li>
        <li className="text-black">Easy form creation and sharing</li>
        <li className="text-black">Secure authentication and response storage</li>
        <li className="text-black">A "Cleanify" feature to clean up messy data</li>
      </ul>
      <div className="flex gap-4">
        <Link href="/login" className="bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-600 shadow">
          Get Started
        </Link>
        <Link href="/dashboard" className="bg-white border border-indigo-500 text-indigo-600 px-6 py-3 rounded-full font-semibold hover:bg-indigo-50 shadow">
          Browse Forms
        </Link>
      </div>
      
    </div>
  );
}
