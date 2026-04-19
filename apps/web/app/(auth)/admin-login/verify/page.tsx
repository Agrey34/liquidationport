'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Verify2FAPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedData.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 selection:bg-neutral-900 selection:text-white">
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex flex-col items-center justify-center mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="w-14 h-14 bg-neutral-900 text-white flex items-center justify-center rounded-2xl shadow-xl text-2xl font-black mb-4">
              LP
           </div>
           <h1 className="text-2xl font-black tracking-tight text-neutral-900">Security Verification</h1>
           <p className="text-sm text-neutral-500 font-semibold tracking-wide">ENTER TWO-FACTOR CODE</p>
        </div>

        {/* 2FA Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
           <div className="p-8 space-y-8">
              
              <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fi fi-rr-mobile-button text-2xl text-blue-600"></i>
                 </div>
                 <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                   We&apos;ve sent a 6-digit authentication code to the device associated with <strong>admin@liqport.com</strong>.
                 </p>
              </div>

              <div className="flex justify-between gap-2">
                 {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-black bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all caret-neutral-900"
                    />
                 ))}
              </div>

              <button className="w-full py-3.5 bg-neutral-900 text-white rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group">
                 Verify & Continue
                 <i className="fi fi-rr-arrow-right transition-transform group-hover:translate-x-1" />
              </button>

           </div>
           
           <div className="bg-neutral-50 p-6 border-t border-neutral-100 flex items-center justify-center flex-col gap-3">
              <p className="text-sm text-neutral-500 font-medium tracking-wide">Didn&apos;t receive a code?</p>
              <button className="text-sm font-bold text-neutral-900 hover:text-blue-600 transition-colors">
                 Resend Authentication Code
              </button>
           </div>
        </div>
        
        <div className="mt-8 text-center animate-in fade-in duration-700 delay-300">
           <Link href="/admin-login" className="text-sm font-semibold text-neutral-400 hover:text-neutral-900 transition-colors flex items-center justify-center gap-2">
              <i className="fi fi-rr-arrow-left" /> Back to Login
           </Link>
        </div>
      </div>
    </div>
  );
}
