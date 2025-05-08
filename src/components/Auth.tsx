import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`최소 ${minLength}자 이상`);
    if (!hasUpperCase) errors.push('대문자 포함');
    if (!hasLowerCase) errors.push('소문자 포함');
    if (!hasNumbers) errors.push('숫자 포함');
    if (!hasSpecialChar) errors.push('특수문자 포함');

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setError(`비밀번호는 다음 조건을 만족해야 합니다:\n${passwordErrors.join('\n')}`);
        return;
      }
    }
    
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        else {
          alert('계정이 생성되었습니다! 로그인해주세요.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        {isLogin ? (
          <>
            <LogIn size={24} className="text-blue-600" />
            로그인
          </>
        ) : (
          <>
            <UserPlus size={24} className="text-blue-600" />
            회원가입
          </>
        )}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start gap-2">
          <AlertCircle className="mt-1 flex-shrink-0" size={16} />
          <div className="whitespace-pre-line">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
          {!isLogin && (
            <p className="mt-1 text-sm text-gray-600">
              비밀번호는 8자 이상, 대소문자, 숫자, 특수문자를 포함해야 합니다.
            </p>
          )}
        </div>

        {!isLogin && (
          <div>
            <label className="block text-gray-700 mb-2">비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {isLogin ? '로그인' : '회원가입'}
        </button>

        <p className="text-center text-gray-600">
          {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? '회원가입' : '로그인'}
          </button>
        </p>
      </form>
    </div>
  );
};