// https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-148.php
export function stringHashCode(str: string): number {
  let arr = str.split('');
  return arr.reduce(
    (hashCode, currentVal) =>
    // eslint-disable-next-line no-bitwise
      (currentVal.charCodeAt(0) + (hashCode << 6) + (hashCode << 16) - hashCode),
    0,
  );
}
