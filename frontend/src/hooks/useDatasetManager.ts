import { useState, useCallback } from "react";
import { generateAttentionData } from "../data/sampleData";
import { SampleData, AttentionData } from "../types";

/**
 * 数据集管理钩子
 * 负责管理数据集、处理句子输入和更新相关状态
 */
export const useDatasetManager = (initialDatasets: SampleData[]) => {
  // 状态
  const [datasets, setDatasets] = useState<SampleData[]>(initialDatasets);
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customDatasetCount, setCustomDatasetCount] = useState(0);

  // 获取当前数据
  const currentData: AttentionData = datasets[selectedDatasetIndex]?.data;

  // 句子提交处理
  const handleSentenceSubmit = useCallback(
    (sentence: string, onDatasetAdded: () => void = () => {}) => {
      setIsProcessing(true);

      // 模拟处理延迟（实际项目中这里会调用API获取真实数据）
      setTimeout(() => {
        const newAttentionData = generateAttentionData(sentence);
        const newDatasetName = `Custom ${customDatasetCount + 1}: "${
          sentence.length > 30 ? sentence.substring(0, 27) + "..." : sentence
        }"`;

        setDatasets((prev) => [
          ...prev,
          {
            name: newDatasetName,
            data: newAttentionData,
          },
        ]);

        setCustomDatasetCount((prev) => prev + 1);
        setSelectedDatasetIndex(datasets.length);
        setIsProcessing(false);

        // 调用回调函数
        onDatasetAdded();
      }, 500);
    },
    [datasets.length, customDatasetCount]
  );

  // 切换数据集
  const selectDataset = useCallback(
    (index: number) => {
      if (index >= 0 && index < datasets.length) {
        setSelectedDatasetIndex(index);
      }
    },
    [datasets.length]
  );

  // 判断是否有用户输入的句子（非初始样本数据）
  const hasUserInput = selectedDatasetIndex >= initialDatasets.length;

  return {
    // 状态
    datasets,
    selectedDatasetIndex,
    isProcessing,
    customDatasetCount,
    currentData,
    hasUserInput,

    // 操作函数
    handleSentenceSubmit,
    selectDataset,
    setSelectedDatasetIndex,
  };
};
