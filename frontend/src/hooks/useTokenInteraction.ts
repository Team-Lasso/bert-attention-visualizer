import { useState, useCallback, useEffect } from "react";
import { AttentionData, WordPrediction } from "../types";

/**
 * Token交互钩子
 * 负责管理token选择、掩码和预测等交互功能
 */
export const useTokenInteraction = (currentData: AttentionData) => {
  // 状态
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(
    null
  );
  const [maskedTokenIndex, setMaskedTokenIndex] = useState<number | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(
    null
  );

  // 重置所有状态
  const resetTokenInteractions = useCallback(() => {
    setSelectedTokenIndex(null); // 设置selectedTokenIndex为null
    setMaskedTokenIndex(null); // 设置maskedTokenIndex为null
    setSelectedPrediction(null); // 设置selectedPrediction为null
  }, []);

  // 单词掩码处理
  const handleMaskWord = useCallback(
    //用户会传入一个tokenIndex，表示要掩码的token的index
    (tokenIndex: number) => {
      // 不允许掩码特殊token
      if (
        currentData?.tokens[tokenIndex]?.text === "[CLS]" ||
        currentData?.tokens[tokenIndex]?.text === "[SEP]"
      ) {
        return;
      }

      // 切换掩码状态
      setMaskedTokenIndex((prevIndex) =>
        prevIndex === tokenIndex ? null : tokenIndex
      );

      // 重置预测选择
      setSelectedPrediction(null);
    },
    [currentData?.tokens]
  );

  // 预测词选择处理
  const handleSelectPrediction = useCallback((word: string) => {
    setSelectedPrediction((prev) => (prev === word ? null : word));
  }, []);

  // 监听全局token选择事件
  useEffect(() => {
    const handleTokenSelection = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && "tokenIndex" in customEvent.detail) {
        setSelectedTokenIndex(customEvent.detail.tokenIndex);
      }
    };

    window.addEventListener("token-selection-change", handleTokenSelection);

    return () => {
      window.removeEventListener(
        "token-selection-change",
        handleTokenSelection
      );
    };
  }, []);

  // 根据掩码token获取预测结果
  const maskPredictions: WordPrediction[] | null =
    maskedTokenIndex !== null && currentData?.maskPredictions
      ? currentData.maskPredictions.find(
          (mp) => mp.tokenIndex === maskedTokenIndex
        )?.predictions || null
      : null;

  // 获取选中的token文本
  const selectedTokenText =
    selectedTokenIndex !== null && currentData?.tokens
      ? currentData.tokens[selectedTokenIndex].text
      : null;

  return {
    // 状态
    selectedTokenIndex,
    maskedTokenIndex,
    selectedPrediction,
    maskPredictions,
    selectedTokenText,

    // 操作函数
    setSelectedTokenIndex,
    handleMaskWord,
    handleSelectPrediction,
    resetTokenInteractions,
  };
};
