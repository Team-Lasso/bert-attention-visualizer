import { useState, useCallback } from 'react';
import { Word, SentenceArray, MaskedSentence } from '../newTypes';

//这是我们在laptop创建的文件：需要修改
export const useSentenceProcessor = () => {
  const [sentence, setSentence] = useState<string>('');
  const [sentenceArray, setSentenceArray] = useState<SentenceArray | null>(null);
  const [maskedSentence, setMaskedSentence] = useState<MaskedSentence | null>(null);

  // 处理用户输入的句子，将其拆分为单词数组
  const processSentence = useCallback((inputSentence: string) => {
    if (!inputSentence.trim()) {
      setSentenceArray(null);
      setMaskedSentence(null);
      return;
    }

    // 分割句子为单词
    const wordTexts = inputSentence.split(/\s+/).filter(word => word.length > 0);
    
    // 创建Word对象数组
    const words: Word[] = wordTexts.map((text, index) => ({ 
      text, 
      index 
    }));
    
    // 创建SentenceArray对象
    const newSentenceArray: SentenceArray = { words };
    
    // 更新状态
    setSentence(inputSentence);
    setSentenceArray(newSentenceArray);
    setMaskedSentence(null); // 重置掩码句子
  }, []);

  // 处理用户选择的掩码单词
  const maskWord = useCallback((wordIndex: number | null) => {
    if (wordIndex === null || !sentenceArray) {
      setMaskedSentence(null);
      return;
    }

    // 创建掩码句子的副本
    const words = [...sentenceArray.words];
    
    // 创建掩码句子文本
    const maskedWords = words.map((word, idx) => 
      idx === wordIndex ? '[MASK]' : word.text
    );
    
    const maskedSentenceText = maskedWords.join(' ');
    
    // 创建MaskedSentence对象
    const newMaskedSentence: MaskedSentence = {
      originalSentence: sentence,
      words: sentenceArray.words,
      maskedWordIndex: wordIndex,
      maskedSentence: maskedSentenceText
    };
    
    // 更新状态
    setMaskedSentence(newMaskedSentence);
  }, [sentence, sentenceArray]);

  return {
    sentence,
    sentenceArray,
    maskedSentence,
    processSentence,
    maskWord
  };
}; 