//这是我们在laptop创建的文件：需要修改
export interface Word {
    text: string;
    index: number;
}

export interface SentenceArray {
    words: Word[];
}

export interface MaskedSentence{
    originalSentence:string;
    words:Word[];
    maskedWordIndex: number | null;
    maskedSentence:string;
}

export interface WordPrediction{
    word:string;
    score:number;
}

export interface PredictionResult{
    maskedWordIndex: number;
    originalWord:string;
    predictions:WordPrediction[];
}
