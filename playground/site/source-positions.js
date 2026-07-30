const utf8Encoder = new TextEncoder();

export function byteOffsetToCodeUnitIndex(source, byteOffset) {
  let consumedBytes = 0;
  let codeUnitIndex = 0;

  for (const character of source) {
    const characterByteLength = utf8Encoder.encode(character).length;
    if (consumedBytes + characterByteLength > byteOffset) {
      return codeUnitIndex;
    }
    consumedBytes += characterByteLength;
    codeUnitIndex += character.length;
  }

  return source.length;
}

export function textPositionFromByteOffset(source, byteOffset) {
  const index = byteOffsetToCodeUnitIndex(source, byteOffset);
  const lineStart = source.lastIndexOf("\n", index - 1) + 1;
  const row = source.slice(0, lineStart).split("\n").length - 1;

  return { index, row, column: index - lineStart };
}
