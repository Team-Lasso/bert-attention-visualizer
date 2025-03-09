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
  //AttentionData是AttentionVisualizer.ts中定义的类型
  
  const currentData: AttentionData = datasets[selectedDatasetIndex]?.data;

  // 句子提交处理
  // 在useAttentionVisualizer.ts中被调用
  // 这个函数是用来处理用户输入的句子的
  const handleSentenceSubmit = useCallback(
    //使用callback，可以避免在每次渲染时重新创建新的函数
    //在参数上，onDatasetAdded是一个可选参数，默认值是一个空函数
    //sentence是用户输入的句子
    (sentence: string, onDatasetAdded: () => void = () => {}) => {
      setIsProcessing(true); // 设置isProcessing状态为true

      // 模拟处理延迟（实际项目中这里会调用API获取真实数据）//todo： 将我们的句子split成为token的feature
      setTimeout(() => {
        const newAttentionData = generateAttentionData(sentence);
        const newDatasetName = `Custom ${customDatasetCount + 1}: "${
          sentence.length > 30 ? sentence.substring(0, 27) + "..." : sentence
        }"`;

        // 将数据集添加到datasets中
        //新增{name: newDatasetName, data: newAttentionData}到datasets中
        //前面的...prev表示复制datasets中的所有数据，然后新增一个数据
        setDatasets((prev) => [
          ...prev,
          {
            name: newDatasetName,
            data: newAttentionData,
          },
        ]);

        // 更新customDatasetCount 让其+1
        setCustomDatasetCount((prev) => prev + 1);

        // 更新selectedDatasetIndex 让其等于datasets的长度
        setSelectedDatasetIndex(datasets.length);

        // 此时，数据集已经更新，isProcessing状态设置为false
        setIsProcessing(false);

        // 调用回调函数，但是在这里，onDatasetAdded是一个空函数，真实函数取决于useAttentionVisualizer.ts中的handleSentenceSubmit
        onDatasetAdded();
      }, 500); //这里的500是模拟处理延迟，实际项目中这里会调用API获取真实数据 //todo
    },
    [datasets.length, customDatasetCount] // 依赖项，当datasets.length或customDatasetCount发生变化时，重新创建新的函数
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
