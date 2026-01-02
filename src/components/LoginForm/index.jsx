import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

const LoginForm = ({ onLogin }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${import.meta.env.VITE_GITHUB_USERNAME}/${import.meta.env.VITE_GITHUB_REPO}/contents/src/data/evaluations/${token}.json`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3.raw'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Invalid evaluation token');
      }

      const data = await response.json();
      await onLogin({ token, data });
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid evaluation token. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#E86161] mb-4">
          Smart Paper Analysis
        </h1>
        <p className="text-xl text-gray-600">
          Token-based Evaluation System
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="token" className="text-gray-700 font-medium block">
                Evaluation Token
              </label>
              <input
                id="token"
                type="text"
                placeholder="Example: eval_1738841626416_0nbojm3te"
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
                disabled={loading}
                className="w-full p-2 border rounded-md"
                required
              />
              <p className="text-sm text-gray-500">
                Enter your evaluation token to begin the assessment.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className={`w-full p-4 rounded-lg text-white transition-colors
                ${loading || !token ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#E86161] hover:bg-[#c54545]'}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                'Start Evaluation'
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;