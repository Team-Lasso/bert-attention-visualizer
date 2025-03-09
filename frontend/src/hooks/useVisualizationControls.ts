import { useState, useCallback } from "react";
import { AttentionData, WordAttentionData } from "../types";

/**
 * 可视化控制钩子
 * 负责管理可视化视图、层和注意力头的选择
 */
export const useVisualizationControls = (currentData: AttentionData) => {
  // 状态
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedHead, setSelectedHead] = useState(0);
  const [activeView, setActiveView] = useState<"matrix" | "parallel">(
    "parallel"
  );

  // 获取当前层数据
  const currentLayerData = currentData?.layers[selectedLayer];

  // 获取当前头数据
  const currentHeadData = currentLayerData?.heads[selectedHead];

  // 视图切换
  const switchView = useCallback((view: "matrix" | "parallel") => {
    setActiveView(view);
  }, []);

  // 计算选中token的注意力数据
  const getWordAttentionData = useCallback(
    (selectedTokenIndex: number | null): WordAttentionData => {
      if (selectedTokenIndex === null || !currentData || !currentHeadData) {
        return {
          sourceWord: "",
          targetWords: [],
          attentionValues: [],
        };
      }

      return {
        sourceWord: currentData.tokens[selectedTokenIndex].text,
        targetWords: currentData.tokens.map((token) => token.text),
        attentionValues: currentHeadData.attention[selectedTokenIndex],
      };
    },
    [currentData, currentHeadData]
  );

  // 重置视图状态为默认值
  const resetViewState = useCallback(() => {
    setSelectedLayer(0);
    setSelectedHead(0);
    setActiveView("parallel");
  }, []);

  return {
    // 状态
    selectedLayer,
    selectedHead,
    activeView,
    currentLayerData,
    currentHeadData,

    // 操作函数
    setSelectedLayer,
    setSelectedHead,
    switchView: setActiveView,
    getWordAttentionData,
    resetViewState,
  };
};
