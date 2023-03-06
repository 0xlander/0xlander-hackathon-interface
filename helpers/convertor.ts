export function ab2str(buf: ArrayBuffer) {
  // const f = new Uint16Array(buf)
  // return String.fromCharCode.apply(null, f)
  const enc = new TextDecoder('utf-8')
  const arr = new Uint8Array(buf)
  return enc.decode(arr)
}

export const str2ab = (str: string) => {
  // const buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
  // const bufView = new Uint16Array(buf)
  // for (let i = 0, strLen = str.length; i < strLen; i++) {
  //   bufView[i] = str.charCodeAt(i)
  // }
  //
  // return buf

  const enc = new TextEncoder() // always utf-8
  return enc.encode(str)
}
