import { useCallback, useEffect } from "react";
import { SampleData, WordAttentionData } from "../types";
import { useModelSelection } from "./useModelSelection";
import { useDatasetManager } from "./useDatasetManager";
import { useTokenInteraction } from "./useTokenInteraction";
import { useVisualizationControls } from "./useVisualizationControls";

/**
 * 主钩子，整合其他小钩子
 * 提供完整的注意力可视化功能
 */
const useAttentionVisualizer = (initialDatasets: SampleData[]) => {
  // 加载数据集管理钩子
  const datasetManager = useDatasetManager(initialDatasets);
  const { currentData, hasUserInput } = datasetManager; //这个里面的currentData保存了useDatasetManager中return里面的currentData

  // 加载模型选择钩子
  const modelSelection = useModelSelection();

  // 加载token交互钩子
  const tokenInteraction = useTokenInteraction(currentData);

  // 加载可视化控制钩子
  const visualizationControls = useVisualizationControls(currentData);

  // 处理模型加载后的重置操作
  const handleLoadModel = useCallback(() => {
    modelSelection.handleLoadModel(() => {
      // 重置token交互和可视化控制状态
      tokenInteraction.resetTokenInteractions();
      visualizationControls.resetViewState();
    });
  }, [
    modelSelection.handleLoadModel,
    tokenInteraction.resetTokenInteractions,
    visualizationControls.resetViewState,
  ]);

  // 处理句子提交
  // 在刚才的分析中我们知道了，handleSentenceSubmit是用来处理用户输入的句子的
  // 其中的onDatasetAdded是一个可选参数，默认值是一个空函数
  //我们在这里给onDatasetAdded传入了tokenInteraction.resetTokenInteractions
  // 所以，当用户输入句子后，会调用tokenInteraction.resetTokenInteractions
  // 然后，tokenInteraction.resetTokenInteractions会重置token交互状态

  const handleSentenceSubmit = useCallback(
    (sentence: string) => {
      datasetManager.handleSentenceSubmit(sentence, () => {
        // 重置token相关状态
        tokenInteraction.resetTokenInteractions(); 
      });
    },
    [
      datasetManager.handleSentenceSubmit,
      tokenInteraction.resetTokenInteractions,
    ]
  );

  // 计算选中token的注意力数据
  const wordAttentionData: WordAttentionData =
    visualizationControls.getWordAttentionData(
      tokenInteraction.selectedTokenIndex
    );

  // 生成用于可视化的tokens数组
  const tokensWithIndex =
    currentData?.tokens.map((token, index) => ({
      ...token,
      index,
    })) || [];

  return {
    // 数据集管理
    ...datasetManager,

    // 模型选择
    ...modelSelection,

    // Token交互
    ...tokenInteraction,

    // 可视化控制
    ...visualizationControls,

    // 组合功能和计算属性
    currentModel: modelSelection.currentModel,
    wordAttentionData,
    tokensWithIndex,
    handleLoadModel,
    handleSentenceSubmit,
  };
};

export default useAttentionVisualizer;
