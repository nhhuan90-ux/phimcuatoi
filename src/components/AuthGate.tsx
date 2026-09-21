import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, ShieldCheck, AlertCircle, Loader2, Delete, Check, Film } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'pct_auth_token';

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingInitial, setIsCheckingInitial] = useState<boolean>(true);

  useEffect(() => {
    // Check existing stored token on mount
    const token = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (token) {
      // Validate token with server in background
      fetch('/api/auth/check', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            // Token expired or invalid
            localStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_KEY);
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          // If network error/offline, assume valid if token format matches
          if (token.startsWith('cGN0LWF1dG') || token.includes('pct-auth')) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        })
        .finally(() => {
          setIsCheckingInitial(false);
        });
    } else {
      setIsCheckingInitial(false);
    }
  }, []);

  if (isCheckingInitial) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0c] flex flex-col items-center justify-center z-[99999] text-white">
        <div className="flex items-center gap-2 mb-4">
          <Film className="w-8 h-8 text-rose-500 animate-pulse" />
          <span className="text-2xl font-black tracking-wider text-rose-500">PHIM<span className="text-white">CỦA</span>TÔI</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-rose-500 mb-2" />
        <p className="text-sm text-zinc-400">Đang khởi tạo ứng dụng...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinAuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return <>{children}</>;
}

interface PinAuthScreenProps {
  onAuthenticated: () => void;
}

function PinAuthScreen({ onAuthenticated }: PinAuthScreenProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input automatically
    inputRefs.current[0]?.focus();
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const verifyPin = async (pinStr: string) => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinStr })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, data.token);
        } else {
          sessionStorage.setItem(STORAGE_KEY, data.token);
        }
        // Small delay to show smooth unlocking animation before rendering app
        setTimeout(() => {
          onAuthenticated();
        }, 600);
      } else {
        triggerShake();
        setErrorMsg(data.message || 'Mã PIN không đúng, vui lòng thử lại!');
        setDigits(['', '', '', '']);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      // In case server has connectivity issue, fallback GET query or check local match
      try {
        const fallbackRes = await fetch(`/api/auth/verify?pin=${encodeURIComponent(pinStr)}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.success) {
          setIsSuccess(true);
          localStorage.setItem(STORAGE_KEY, fallbackData.token);
          setTimeout(() => onAuthenticated(), 600);
          return;
        }
      } catch (e) {}

      triggerShake();
      setErrorMsg('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại!');
      setDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (loading || isSuccess) return;
    setErrorMsg(null);

    // If user pasted multiple characters
    const cleanDigits = value.replace(/\D/g, '');
    if (cleanDigits.length > 1) {
      const newDigits = ['', '', '', ''];
      for (let i = 0; i < 4 && i < cleanDigits.length; i++) {
        newDigits[i] = cleanDigits[i];
      }
      setDigits(newDigits);
      if (cleanDigits.length >= 4) {
        verifyPin(newDigits.join(''));
      } else {
        inputRefs.current[Math.min(cleanDigits.length, 3)]?.focus();
      }
      return;
    }

    const singleDigit = cleanDigits.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 4 digits are filled, automatically verify
    if (index === 3 && singleDigit) {
      const fullPin = newDigits.join('');
      if (fullPin.length === 4) {
        verifyPin(fullPin);
      }
    } else {
      const fullPin = newDigits.join('');
      if (fullPin.length === 4 && !newDigits.includes('')) {
        verifyPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullPin = digits.join('');
      if (fullPin.length === 4) {
        verifyPin(fullPin);
      }
    }
  };

  const handleNumpadPress = (num: string) => {
    if (loading || isSuccess) return;
    setErrorMsg(null);
    const emptyIndex = digits.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      const newDigits = [...digits];
      newDigits[emptyIndex] = num;
      setDigits(newDigits);
      inputRefs.current[emptyIndex]?.focus();

      if (emptyIndex === 3) {
        const fullPin = newDigits.join('');
        verifyPin(fullPin);
      } else {
        inputRefs.current[emptyIndex + 1]?.focus();
      }
    }
  };

  const handleNumpadDelete = () => {
    if (loading || isSuccess) return;
    setErrorMsg(null);
    let targetIndex = -1;
    for (let i = 3; i >= 0; i--) {
      if (digits[i] !== '') {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex !== -1) {
      const newDigits = [...digits];
      newDigits[targetIndex] = '';
      setDigits(newDigits);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  const handleNumpadSubmit = () => {
    const fullPin = digits.join('');
    if (fullPin.length === 4) {
      verifyPin(fullPin);
    } else {
      setErrorMsg('Vui lòng nhập đủ 4 chữ số mã PIN');
      triggerShake();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#070709] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(225,29,72,0.18),rgba(255,255,255,0))] text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Background ambient decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div 
        className={`relative w-full max-w-sm sm:max-w-md bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,72,0.12)] transition-all duration-300 ${
          shake ? 'animate-shake border-rose-500/80 ring-2 ring-rose-500/30' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              isSuccess 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.35)]' 
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
            }`}>
              {isSuccess ? (
                <Unlock className="w-8 h-8 animate-bounce" />
              ) : (
                <Lock className="w-8 h-8 animate-pulse-subtle" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-zinc-700 p-1 rounded-full text-zinc-300">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-rose-500">PHIM<span className="text-white">CỦA</span>TÔI</span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-zinc-200">
            {isSuccess ? 'Xác thực thành công!' : 'Nhập Mật Khẩu Truy Cập'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-[260px]">
            {isSuccess 
              ? 'Đang tải giao diện web lên...' 
              : 'Trang web được bảo vệ. Vui lòng nhập mã PIN 4 số để tiếp tục.'}
          </p>
        </div>

        {/* 4-digit PIN Inputs */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 my-6">
          {digits.map((digit, index) => {
            const isFilled = Boolean(digit);
            const isCurrent = !isSuccess && digits.findIndex(d => d === '') === index;

            return (
              <div key={index} className="relative">
                <input
                  ref={el => { inputRefs.current[index] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  disabled={loading || isSuccess}
                  value={digit}
                  onChange={e => handleDigitChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={e => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text');
                    handleDigitChange(index, text);
                  }}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold rounded-2xl outline-none transition-all duration-200 bg-zinc-900/90 text-white select-none ${
                    isSuccess
                      ? 'border-emerald-500/80 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : isFilled
                      ? 'border-rose-500 bg-zinc-900 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/50'
                      : isCurrent
                      ? 'border-zinc-500 ring-2 ring-rose-500/40 bg-zinc-900/60'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Status / Error Message */}
        <div className="min-h-[28px] flex items-center justify-center text-center px-2">
          {loading && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              <span>Đang kiểm tra mã PIN với máy chủ...</span>
            </div>
          )}
          {errorMsg && !loading && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-rose-400 font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {isSuccess && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-400 font-medium animate-fadeIn">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Khớp mã PIN! Đang vào hệ thống...</span>
            </div>
          )}
        </div>

        {/* Numeric On-Screen Keypad for Touch / Remote */}
        <div className="mt-5 pt-5 border-t border-zinc-800/60">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[260px] sm:max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                disabled={loading || isSuccess}
                onClick={() => handleNumpadPress(num)}
                className="h-11 sm:h-12 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 active:scale-95 active:bg-rose-500/20 text-lg sm:text-xl font-semibold text-zinc-200 border border-zinc-800/60 transition-all duration-150 flex items-center justify-center select-none"
              >
                {num}
              </button>
            ))}
            {/* Row 4: Delete, 0, Submit */}
            <button
              type="button"
              disabled={loading || isSuccess || digits.every(d => d === '')}
              onClick={handleNumpadDelete}
              title="Xoá số vừa nhập"
              className="h-11 sm:h-12 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 active:scale-95 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60 transition-all duration-150 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={loading || isSuccess}
              onClick={() => handleNumpadPress('0')}
              className="h-11 sm:h-12 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 active:scale-95 active:bg-rose-500/20 text-lg sm:text-xl font-semibold text-zinc-200 border border-zinc-800/60 transition-all duration-150 flex items-center justify-center select-none"
            >
              0
            </button>
            <button
              type="button"
              disabled={loading || isSuccess || digits.join('').length !== 4}
              onClick={handleNumpadSubmit}
              title="Xác nhận mã PIN"
              className="h-11 sm:h-12 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-medium border border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] transition-all duration-150 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer Options */}
        <div className="mt-5 flex items-center justify-between text-xs text-zinc-500 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-zinc-400 transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-rose-500/30"
            />
            <span>Ghi nhớ thiết bị</span>
          </label>
          <span className="text-[11px] text-zinc-500">Mã PIN: 4 chữ số</span>
        </div>
      </div>
    </div>
  );
}
