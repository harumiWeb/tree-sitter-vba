function utf8ByteLength(character) {
  const codePoint = character.codePointAt(0);
  if (codePoint <= 0x7f) return 1;
  if (codePoint <= 0x7ff) return 2;
  if (codePoint <= 0xffff) return 3;
  return 4;
}

export function createSourcePositionIndex(source) {
  const codeUnitIndexByByteOffset = [];
  const lineStartIndices = [0];
  let byteOffset = 0;
  let codeUnitIndex = 0;

  for (const character of source) {
    const byteLength = utf8ByteLength(character);
    for (let index = 0; index < byteLength; index += 1) {
      codeUnitIndexByByteOffset[byteOffset + index] = codeUnitIndex;
    }
    byteOffset += byteLength;
    codeUnitIndex += character.length;
    codeUnitIndexByByteOffset[byteOffset] = codeUnitIndex;
    if (character === "\n") lineStartIndices.push(codeUnitIndex);
  }

  function byteOffsetToCodeUnitIndexAt(offset) {
    const clampedOffset = Math.max(0, Math.min(offset, byteOffset));
    return codeUnitIndexByByteOffset[clampedOffset] ?? source.length;
  }

  function textPositionFromByteOffsetAt(offset) {
    const index = byteOffsetToCodeUnitIndexAt(offset);
    let low = 0;
    let high = lineStartIndices.length;
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (lineStartIndices[middle] <= index) {
        low = middle;
      } else {
        high = middle;
      }
    }
    return { index, row: low, column: index - lineStartIndices[low] };
  }

  return {
    byteOffsetToCodeUnitIndex: byteOffsetToCodeUnitIndexAt,
    textPositionFromByteOffset: textPositionFromByteOffsetAt,
  };
}

export function byteOffsetToCodeUnitIndex(source, byteOffset) {
  return createSourcePositionIndex(source).byteOffsetToCodeUnitIndex(byteOffset);
}

export function textPositionFromByteOffset(source, byteOffset) {
  return createSourcePositionIndex(source).textPositionFromByteOffset(byteOffset);
}
