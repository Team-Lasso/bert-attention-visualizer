//todo: need to figure out what value been passing to the word mask component

export const splitSentence = (sentence: string) => {
  //split the sentence into words
    const wordInSentence = sentence.split(/\s+/);
  
    //Create each word  as a array(not token now)
    const words = wordInSentence.map((word, index) => word.split(""));
};



