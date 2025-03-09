import { useState, useCallback } from "react";
import { pretrainedModels } from "../data/pretrainedModels";
import { ModelConfig } from "../types";

/**
 * 模型选择和加载的钩子
 * 负责管理模型选择、加载状态和显示状态
 */
export const useModelSelection = () => {
  // 状态
  const [selectedModelId, setSelectedModelId] =
    useState<string>("bert-base-uncased");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // 获取当前模型信息
  const currentModel =
    pretrainedModels.find(
      (model: ModelConfig) => model.id === selectedModelId
    ) || pretrainedModels[0];

  // 模型选择处理
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
  }, []);

  // 模型加载处理
  const handleLoadModel = useCallback((onModelLoaded: () => void) => {
    setIsModelLoading(true);

    // 模拟加载延迟（实际项目中这里会有真实的模型加载逻辑）
    setTimeout(() => {
      setIsModelLoading(false);
      setShowModelSelector(false);

      // 调用加载完成的回调
      onModelLoaded();
    }, 1500);
  }, []);

  // 切换模型选择器显示状态
  const toggleModelSelector = useCallback(() => {
    setShowModelSelector((prev) => !prev);
  }, []);

  return {
    // 状态
    selectedModelId,
    isModelLoading,
    showModelSelector,
    currentModel,

    // 操作函数
    handleModelSelect,
    handleLoadModel,
    toggleModelSelector,
    setShowModelSelector,
  };
};
