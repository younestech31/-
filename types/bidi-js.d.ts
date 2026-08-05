declare module 'bidi-js' {
  export interface EmbeddingLevelsResult {
    levels: Uint8Array;
    paragraphs: Array<{ start: number; end: number; level: number }>;
  }

  export interface Bidi {
    getEmbeddingLevels(text: string): EmbeddingLevelsResult;
    getReorderedString(text: string, levels: EmbeddingLevelsResult): string;
    getBidiCharType(char: string): string;
  }

  export default function bidiFactory(): Bidi;
}
