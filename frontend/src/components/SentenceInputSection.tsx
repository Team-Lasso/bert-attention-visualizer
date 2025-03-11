import React, { useState } from 'react';

//这是我们在laptop创建的文件：需要修改
interface SentenceInputSectionProps {
  processSentence: (sentence: string) => void;
}

const SentenceInputSection: React.FC<SentenceInputSectionProps> = ({ 
  processSentence 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      processSentence(inputValue);
    }
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h2 className="text-lg font-semibold mb-2">输入句子</h2>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          placeholder="输入一个句子，例如：The cat sat on the mat."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          处理句子
        </button>
      </form>
    </div>
  );
};

export default SentenceInputSection; 