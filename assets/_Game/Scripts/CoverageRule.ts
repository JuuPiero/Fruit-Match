/** Một quả, rút gọn về những gì coverage rule cần. */
export interface CoverPoint {
    x: number
    y: number
    stackId: number
    layer: number // 0 = trên cùng (nông nhất)
}

/**
 * Port 1:1 của CoverageRule.cs (Unity):
 *   1) blockCount = số quả CÒN SỐNG cùng stack có layer <= mình (tính cả bản thân).
 *   2) blockCount < bcThreshold  => KHÔNG bị chặn (luôn mở).
 *   3) coverDistance <= 0        => chặn thuần theo block-count (không xét khoảng cách).
 *   4) ngược lại: chỉ thực sự bị chặn nếu có quả khác (bất kỳ stack nào, không riêng
 *      cùng stack) ở layer nông hơn (vẽ trên) nằm trong bán kính coverDistance.
 *      Nếu không quả nào đủ gần => chỉ là "che danh nghĩa", vẫn mở.
 */
export function isBlocked(me: CoverPoint, alive: CoverPoint[], bcThreshold: number, coverDistance: number): boolean {
    let blockCount = -1
    for (const o of alive) {
        if (o.stackId === me.stackId && o.layer <= me.layer) blockCount++
    }
    if (blockCount < bcThreshold) return false
    if (coverDistance <= 0) return true

    const d2 = coverDistance * coverDistance
    for (const o of alive) {
        if (o.layer >= me.layer) continue // không vẽ trên mình => bỏ qua
        const dx = o.x - me.x
        const dy = o.y - me.y
        if (dx * dx + dy * dy < d2) return true
    }
    return false
}
