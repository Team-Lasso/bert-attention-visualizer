import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface SentenceInputProps {
  onSentenceSubmit: (sentence: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

const MAX_WORDS = 30;

const SentenceInput: React.FC<SentenceInputProps> = ({
  onSentenceSubmit,
  isLoading,
  initialValue = "",
}) => {
  const [sentence, setSentence] = useState(initialValue);
  const [wordCount, setWordCount] = useState(0);
  const lastValidInput = useRef(initialValue);

  // Update local state when initialValue changes
  useEffect(() => {
    if (initialValue) {
      setSentence(initialValue);
      // Count words in initial value
      const count = countWords(initialValue);
      setWordCount(count);
      lastValidInput.current = initialValue;
    }
  }, [initialValue]);

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sentence.trim()) {
      onSentenceSubmit(sentence.trim());
    }
  };

  // Custom change handler enforcing a word limit
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;

    // If deleting text, always allow it
    if (inputValue.length < sentence.length) {
      const newCount = countWords(inputValue);
      setSentence(inputValue);
      setWordCount(newCount);
      lastValidInput.current = inputValue;
      return;
    }

    // Split the value by whitespace and filter out any empty strings
    const words = inputValue.split(/\s+/).filter(Boolean);
    const currentWordCount = words.length;

    // Only update if within the limit
    if (currentWordCount <= MAX_WORDS) {
      setSentence(inputValue);
      setWordCount(currentWordCount);
      lastValidInput.current = inputValue;
    } else {
      // If exceeded, keep the last valid input
      setSentence(lastValidInput.current);
      // Optional: Show feedback to user that limit is reached
      // e.g., flash the word count or show a temporary message
    }
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Enter Your Own Sentence
      </h3>
      <p className="text-sm text-gray-500 mb-3">Type a paragraph to analyze (max 30 words)</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <textarea
            value={sentence}
            onChange={handleChange}
            placeholder="E.g., The cat sat on the mat"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            disabled={isLoading}
            rows={3}
          />
          <div className="flex justify-between">
            <span className={`text-xs ${wordCount >= MAX_WORDS ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              {wordCount}/{MAX_WORDS} words
            </span>
            {sentence && (
              <button
                type="button"
                onClick={() => {
                  setSentence("");
                  setWordCount(0);
                  lastValidInput.current = "";
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!sentence.trim() || isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing
            </div>
          ) : (
            <div className="flex items-center">
              <Send size={16} className="mr-2" />
              Analyze
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default SentenceInput;
