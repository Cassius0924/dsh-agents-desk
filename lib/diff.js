/**
 * Line diff for the generation proposal and history comparison.
 *
 * The client accepts hunks independently, so each hunk carries its exact old
 * range plus the replacement lines. Small files only; a large pair falls back
 * to one whole-file hunk instead of allocating a huge DP table.
 */

const DP_CELL_CAP = 4_000_000

/** Compute the ops (keep/delete/insert) between two line arrays. */
function opsBetween(a, b) {
  const n = a.length
  const m = b.length
  if (n * m > DP_CELL_CAP) {
    return [
      ...a.map(text => ({ t: '-', text })),
      ...b.map(text => ({ t: '+', text })),
    ]
  }
  const width = m + 1
  const dp = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * width + j] = a[i] === b[j]
        ? dp[(i + 1) * width + j + 1] + 1
        : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1])
    }
  }
  const ops = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ t: ' ', text: a[i] }); i += 1; j += 1 }
    else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) { ops.push({ t: '-', text: a[i] }); i += 1 }
    else { ops.push({ t: '+', text: b[j] }); j += 1 }
  }
  while (i < n) { ops.push({ t: '-', text: a[i] }); i += 1 }
  while (j < m) { ops.push({ t: '+', text: b[j] }); j += 1 }
  return ops
}

/** Group ops into hunks with context lines; each hunk is independently applicable. */
export function diffHunks(oldText, newText, context = 3) {
  if (oldText === newText) return []
  const a = oldText.split('\n')
  const b = newText.split('\n')
  const ops = opsBetween(a, b)
  const positions = []
  let oldNo = 1
  let newNo = 1
  for (const op of ops) {
    positions.push({ oldNo, newNo })
    if (op.t !== '+') oldNo += 1
    if (op.t !== '-') newNo += 1
  }
  const ranges = []
  for (let i = 0; i < ops.length; i += 1) {
    if (ops[i].t === ' ') continue
    const start = Math.max(0, i - context)
    const end = Math.min(ops.length - 1, i + context)
    const last = ranges[ranges.length - 1]
    if (last && start <= last.end + 1) last.end = Math.max(last.end, end)
    else ranges.push({ start, end })
  }
  return ranges.map(({ start, end }) => {
    const slice = ops.slice(start, end + 1)
    const oldLines = slice.filter(op => op.t !== '+').map(op => op.text)
    const newLines = slice.filter(op => op.t !== '-').map(op => op.text)
    return {
      oldStart: positions[start].oldNo,
      newStart: positions[start].newNo,
      oldLines: oldLines.length,
      newLines: newLines.length,
      oldText: oldLines,
      newText: newLines,
      lines: slice,
    }
  })
}

/** Rebuild a file from the original lines and the hunks the user accepted. */
export function applyHunks(oldText, hunks, accepted) {
  const isAccepted = index => (Array.isArray(accepted) ? accepted[index] === true : accepted.has(index))
  const a = oldText.split('\n')
  const out = []
  let cursor = 0
  for (const [index, hunk] of hunks.entries()) {
    const start = hunk.oldStart - 1
    out.push(...a.slice(cursor, start))
    if (isAccepted(index)) out.push(...hunk.newText)
    else out.push(...a.slice(start, start + hunk.oldLines))
    cursor = start + hunk.oldLines
  }
  out.push(...a.slice(cursor))
  return out.join('\n')
}
