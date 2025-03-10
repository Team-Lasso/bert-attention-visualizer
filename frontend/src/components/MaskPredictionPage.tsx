import React from 'react';
import SentenceInputSection from './SentenceInputSection';
import WordMaskingSection from './WordMaskingSection';
import { useSentenceProcessor } from '../hooks/useSentenceProcessor';

//这是我们在laptop创建的文件：需要修改
const MaskPredictionPage: React.FC = () => {
  // 使用我们创建的hook
  const {
    sentenceArray,
    maskedSentence,
    processSentence,
    maskWord
  } = useSentenceProcessor();

  // 获取掩码单词索引
  const maskedWordIndex = maskedSentence?.maskedWordIndex || null;

  // 暂时使用一个空函数作为预测点击处理器
  const handlePredictClick = () => {
    console.log('预测按钮被点击了');
    console.log('掩码句子:', maskedSentence?.maskedSentence);
    // 这里将来会进行实际的预测操作
    // 例如，调用Hugging Face的模型进行预测
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">BERT 掩码预测</h1>
      
      {/* 句子输入部分 */}
      <SentenceInputSection processSentence={processSentence} />
      
      {/* 单词掩码部分 */}
      <WordMaskingSection
        sentenceArray={sentenceArray}
        maskedWordIndex={maskedWordIndex}
        maskWord={maskWord}
        onPredictClick={handlePredictClick}
      />
      
      {/* 这里将来会添加预测结果显示部分 */}
      {maskedSentence && (
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">掩码信息</h2>
          <p><strong>原始句子:</strong> {maskedSentence.originalSentence}</p>
          <p><strong>掩码句子:</strong> {maskedSentence.maskedSentence}</p>
          <p><strong>掩码单词索引:</strong> {maskedSentence.maskedWordIndex}</p>
          <p><strong>掩码单词:</strong> {maskedSentence.maskedWordIndex !== null 
            ? maskedSentence.words[maskedSentence.maskedWordIndex].text 
            : 'None'}</p>
        </div>
      )}
    </div>
  );
};

export default MaskPredictionPage; 