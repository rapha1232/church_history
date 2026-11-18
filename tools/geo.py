import json, math
def decode(path):
    t = json.load(open(path)); sc, tr = t['transform']['scale'], t['transform']['translate']
    arcs = []
    for a in t['arcs']:
        x = y = 0; pts = []
        for dx, dy in a: x += dx; y += dy; pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
        arcs.append(pts)
    def ring(ix):
        out = []
        for i in ix:
            p = arcs[i] if i >= 0 else arcs[~i][::-1]
            out += p[1:] if out else p
        return out
    polys = []
    for g in t['objects']['land']['geometries']:
        cs = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        for poly in cs: polys += [ring(r) for r in poly]
    return polys
def svgpath(polys, proj, box, W, H, minarea=0.6):
    x0, y0, x1, y1 = box; out = []
    for r in polys:
        pts = [proj(lo, la) for lo, la in r]
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        if max(xs) < x0 or min(xs) > x1 or max(ys) < y0 or min(ys) > y1: continue
        sx = W / (x1 - x0); sy = H / (y1 - y0)
        q = []; last = None
        for x, y in pts:
            P = (round((x - x0) * sx, 1), round((y - y0) * sy, 1))
            if P != last: q.append(P); last = P
        if len(q) < 3: continue
        a = abs(sum(q[i][0] * q[i - 1][1] - q[i - 1][0] * q[i][1] for i in range(len(q)))) / 2
        if a < minarea: continue
        out.append('M' + 'L'.join('%g %g' % p for p in q) + 'Z')
    return ''.join(out)
def regional():
    k = math.cos(math.radians(40))
    proj = lambda lo, la: (lo * k, -la)
    box = (-12 * k, -60.5, 62 * k, -8.5)  # lon -12..62, lat 8.5..60.5
    W = 1000; H = round(W * (box[3] - box[1]) / (box[2] - box[0]))
    return proj, box, W, H
def world():
    proj = lambda lo, la: (lo, -math.degrees(math.log(math.tan(math.pi / 4 + math.radians(max(-80, min(80, la))) / 2))))
    box = (-170, -proj(0, 72)[1] * -1, 190, -proj(0, -50)[1] * -1)
    box = (-170, proj(0, 72)[1], 190, proj(0, -50)[1])
    W = 1000; H = round(W * (box[3] - box[1]) / (box[2] - box[0]))
    return proj, box, W, H
if __name__ == '__main__':
    R = '/home/user/church/geo/'
    p, b, W, H = regional(); d1 = svgpath(decode(R + 'land-50m.json'), p, b, W, H)
    p2, b2, W2, H2 = world(); d2 = svgpath(decode(R + 'land-110m.json'), p2, b2, W2, H2, 2)
    json.dump({'reg': {'d': d1, 'w': W, 'h': H}, 'world': {'d': d2, 'w': W2, 'h': H2}}, open(R + 'paths.json', 'w'))
    print(len(d1), W, H, len(d2), W2, H2)
