from PIL import Image
import random, math
W,H,S=200,150,6
img=Image.new('RGB',(W,H)); P=img.load()
def hx(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
C={k:hx(v) for k,v in dict(bg0='#070a18',bg1='#0d1230',bg2='#161d45',star='#ffffff',star2='#8fa8ff',
 att='#ff8a3d',attd='#b3531a',attl='#ffc28f',ffn='#3d8bff',ffnd='#1f4fa8',ffnl='#a8cbff',nrm='#ffd23d',nrmd='#a8830c',nrml='#fff0a8',
 emb='#3dd68c',embd='#1c8a52',embl='#b0f5d2',sm='#b07cff',smd='#6a3fb8',sml='#dcc6ff',lin='#ff5fa8',lind='#a82d68',linl='#ffc2de',
 txt='#f4f6ff',mu='#7a86b8',dk='#0a0d1c',cy='#3de0ff',cyd='#1a7f99',metal='#c3cbe0',metald='#6b7594',metall='#eef2ff',red='#ff4d6d').items()}
def px(x,y,c):
    if 0<=x<W and 0<=y<H: P[x,y]=c
def rect(x,y,w,h,c):
    for i in range(x,x+w):
        for j in range(y,y+h): px(i,j,c)
def box(x,y,w,h,base,dark,light,border=None):
    rect(x,y,w,h,base); rect(x,y,w,1,light); rect(x,y,1,h,light); rect(x,y+h-1,w,1,dark); rect(x+w-1,y,1,h,dark)
    b=border or C['dk']
    rect(x-1,y-1,w+2,1,b); rect(x-1,y+h,w+2,1,b); rect(x-1,y,1,h,b); rect(x+w,y,1,h,b)
def line(x0,y0,x1,y1,c):
    dx,dy=abs(x1-x0),-abs(y1-y0); sx=1 if x0<x1 else -1; sy=1 if y0<y1 else -1; e=dx+dy
    while True:
        px(x0,y0,c)
        if x0==x1 and y0==y1: break
        e2=2*e
        if e2>=dy: e+=dy; x0+=sx
        if e2<=dx: e+=dx; y0+=sy
F={'A':".#.#.####.##.#",'B':"##.#.###.#.###.",'C':".###..#..#...##",'D':"##.#.##.##.###.",'E':"####..##.#..###",'F':"####..##.#..#..",
'G':".###..#.##.#.##",'H':"#.##.####.##.#",'I':"###.#..#..#.###",'K':"#.##.###.#.##.#",'L':"#..#..#..#..###",'M':"#.#####.##.##.#",
'N':"##.#.##.##.##.#",'O':".#.#.##.##.#.#.",'P':"##.#.###.#..#..",'Q':".#.#.##.###..##",'R':"##.#.###.#.##.#",'S':".###...#...###.",
'T':"###.#..#..#..#.",'U':"#.##.##.##.####",'V':"#.##.##.##.#.#.",'W':"#.##.#######.#",'X':"#.##.#.#.#.##.#",'Y':"#.##.#.#..#..#.",
'Z':"###..#.#.#..###",'+':"....#.###.#....",'-':"......###......",' ':"."*15,'.':"............#..",'0':"####.##.##.####",
'1':".#.##..#..#.###",'2':"##...#.#.#..###",'3':"##...#.#...###.",'x':"...#.#.#.#.#...",'>':"#...#...#.#.#..",'/':"..#..#.#.#..#.."}
for k,v in list(F.items()):
    if len(v)<15: F[k]=(v+'.'*15)[:15]
# fix glyphs defined with 14 chars: rebuild explicitly
F['A']=".#.#.####.##.#".ljust(15,'.'); F['A']=".#."+"#.#"+"###"+"#.#"+"#.#"
F['H']="#.#"+"#.#"+"###"+"#.#"+"#.#"; F['W']="#.#"+"#.#"+"###"+"###"+"#.#"
WIDE={'M':"#...###.###.#.##...##...#",'W':"#...##...##.#.###.###...#",'N':"#..###.##.###..##..#"}
def glyph(ch):
    if ch in WIDE: g=WIDE[ch]; return g,len(g)//5
    return F.get(ch,F[' ']),3
def text(x,y,s,c,sc=1,shadow=None):
    cx=x
    for ch in s:
        g,w=glyph(ch)
        for layer,col,off in ((0,shadow,sc//2 if sc>1 else 1),(1,c,0)):
            if col is None: continue
            for r in range(5):
                for q in range(w):
                    if g[r*w+q]=='#': rect(cx+q*sc+off,y+r*sc+off,sc,sc,col)
        cx+=(w+1)*sc
def tw(s,sc=1): return sum((glyph(ch)[1]+1)*sc for ch in s)-sc
# ---------- background ----------
random.seed(7)
for y in range(H):
    t=y/H
    for x in range(W):
        if t<0.45: c=C['bg0'] if (t<0.3 or (x+y)%2) else C['bg1']
        elif t<0.8: c=C['bg1'] if (t<0.6 or (x+y)%2) else C['bg2']
        else: c=C['bg2']
        P[x,y]=c
for _ in range(90):
    x,y=random.randrange(W),random.randrange(int(H*0.75)); px(x,y,C['star'] if random.random()<.35 else C['star2'])
for (x,y) in [(18,12),(182,20),(160,8),(30,30)]:
    px(x,y,C['star']); px(x-1,y,C['star2']); px(x+1,y,C['star2']); px(x,y-1,C['star2']); px(x,y+1,C['star2'])
# retro grid floor
hy=128
for x in range(W):
    for y in range(hy,H):
        if (y-hy) in (0,3,7,12,18): px(x,y,C['cyd'])
for k in range(-12,13):
    x0=100+k*9; x1=100+k*30; line(x0,hy,x1,H-1,C['cyd'])
# ---------- title ----------
T='TRANSFORMER'; text((W-tw(T,2))//2,5,T,C['txt'],2,shadow=C['smd'])
st='SELF-ATTENTION  +  IA'; text((W-tw(st))//2,18,st,C['cy'])
# ---------- tower ----------
tx,twd=76,48; cxm=tx+twd//2
def arrow_up(x,y0,y1,c=C['txt']):
    rect(x,y1+1,1,y0-y1,c); px(x-1,y1+2,c); px(x+1,y1+2,c); px(x,y1+1,c)
# output token
tok='COME'; bw=tw(tok)+8; box(cxm-bw//2,27,bw,9,C['sm'],C['smd'],C['sml']); text(cxm-bw//2+4,29,tok,C['dk'])
px(cxm+bw//2+3,26,C['star']); px(cxm+bw//2+5,24,C['sml']); px(cxm-bw//2-4,25,C['star'])
# softmax bars
vals=[3,5,9,4,2,6,3,2]
for i,v in enumerate(vals):
    col=C['sml'] if v==9 else C['sm']; rect(tx+6+i*5,48-v,3,v,col)
rect(tx+4,48,40,1,C['mu'])
arrow_up(cxm,52,48)
layers=[('SOFTMAX',53,8,'sm'),('LINEAR',64,8,'lin'),('ADD+NORM',77,8,'nrm'),('FEED FWD',88,11,'ffn'),('ADD+NORM',102,8,'nrm'),('ATTENTION',113,13,'att'),('EMBED',131,8,'emb')]
for i,(lab,y,h,k) in enumerate(layers):
    box(tx,y,twd,h,C[k],C[k+'d'],C[k+'l'])
    ty=y+(h-5)//2 if lab!='ATTENTION' else y+2
    text(cxm-tw(lab)//2,ty,lab,C['dk'])
    if i>0:
        py=layers[i-1][1]+layers[i-1][2]
        if y-py>2: arrow_up(cxm,y-1,py)
# multi-head marks inside attention
for j in range(3): rect(cxm-10+j*8,121,5,2,C['attd']); 
text(cxm-tw('QKV')//2+0,121,'',C['dk'])
# QKV labels below attention entering
for j,ch in enumerate('QKV'):
    x=cxm-12+j*12; rect(x,127,1,4,C['attl']); text(x-1,127,'',C['dk'])
# bracket Nx
bx=tx-6; rect(bx,76,1,51,C['mu']); rect(bx,76,3,1,C['mu']); rect(bx,126,3,1,C['mu'])
text(bx-13,99,'Nx',C['txt'])
# residual connections (right side)
rx=tx+twd+3
for (y0,y1) in [(128,106),(101,81)]:
    rect(tx+twd,y0,4,1,C['metal']); rect(rx+1,y1,1,y0-y1+1,C['metal']); rect(tx+twd,y1,4,1,C['metal']); px(tx+twd+1,y1-1,C['metal']); px(tx+twd+1,y1+1,C['metal'])
# positional encoding wave (left of embed)
for x in range(44,70):
    y=int(round(135+3*math.sin((x-44)/3.2))); px(x,y,C['emb']); 
box(66,132,7,6,C['bg2'],C['dk'],C['mu']); text(68,132,'+',C['txt'])
text(40,142,'POS',C['emb'])
# input tokens below? place inside floor: show token chips at bottom
arrow_up(cxm,146,139)
for j,t in enumerate(['EL','GATO']):
    w=tw(t)+6; x=cxm-26+j*22 if j==0 else cxm-3
    box(x,142,w,7,C['metal'],C['metald'],C['metall']); text(x+3,143,t,C['dk'])
# ---------- robot / AI (left) ----------
rx0,ry0=8,52
rect(rx0+14,ry0-10,2,8,C['metald']); rect(rx0+13,ry0-13,4,3,C['red']); px(rx0+14,ry0-13,C['txt'])
box(rx0,ry0,30,26,C['metal'],C['metald'],C['metall'])
box(rx0+3,ry0+4,24,10,C['dk'],C['dk'],C['bg2'],border=C['metald'])
for ex in (rx0+7,rx0+19):
    rect(ex,ry0+7,4,4,C['cy']); px(ex,ry0+7,C['txt']); px(ex+1,ry0+7,C['txt'])
for k in range(5): rect(rx0+6+k*4,ry0+18,2,3,C['metald'])
box(rx0-4,ry0+8,3,9,C['metald'],C['dk'],C['metal']); box(rx0+31,ry0+8,3,9,C['metald'],C['dk'],C['metal'])
box(rx0+5,ry0+27,20,20,C['metal'],C['metald'],C['metall'])
# chest chip
box(rx0+9,ry0+31,12,10,C['bg2'],C['dk'],C['cyd']); text(rx0+10,ry0+33,'AI',C['cy'])
for k in range(3): px(rx0+9+k*4+1,ry0+30,C['metald']); px(rx0+9+k*4+1,ry0+41,C['metald'])
text(rx0+1,ry0+50,'ROBOT',C['mu'])
# circuit from robot to tower
pts=[(rx0+25,ry0+36),(52,ry0+36),(52,95),(tx-9,95)]
for (a,b),(c,d) in zip(pts,pts[1:]): line(a,b,c,d,C['cy'])
for (a,b) in pts[1:]: rect(a-1,b-1,3,3,C['cy']); px(a,b,C['txt'])

# floating bits
for (x,y,s) in [(10,24,'10'),(44,38,'01'),(192,128,'1'),(186,30,'0')]:
    text(x,y,s,C['cyd'])
# ---------- attention map (right) ----------
gx,gy,cs=150,52,6
text(gx+18-tw('ATTN')//2,42,'ATTN',C['att'])
random.seed(3)
for i in range(6):
    for j in range(6):
        if j>i: c=C['bg2']
        else:
            v=random.random()*(0.5 if j!=i-1 else 1)+ (0.5 if j==i-1 else 0)
            c=C['attl'] if v>0.9 else C['att'] if v>0.55 else C['attd'] if v>0.25 else C['bg1']
        rect(gx+j*cs,gy+i*cs,cs-1,cs-1,c)
rect(gx-2,gy-2,6*cs+3,1,C['mu']); rect(gx-2,gy+6*cs,6*cs+3,1,C['mu']); rect(gx-2,gy-2,1,6*cs+3,C['mu']); rect(gx+6*cs,gy-2,1,6*cs+3,C['mu'])

# connection from tower attention to map
line(tx+twd+6,119,gx-4,119,C['att']); line(gx-4,119,gx-4,gy+6*cs+1,C['att']); rect(gx-5,gy+6*cs+1,3,3,C['att'])
# embedding vectors (right bottom)
text(150,100,'VEC',C['emb'])
random.seed(11)
for i in range(6):
    for j in range(5):
        v=random.random(); c=C['embl'] if v>.75 else C['emb'] if v>.4 else C['embd']
        rect(170+i*4,98+j*4,3,3,c)
img.save('native.png'); img.resize((W*S,H*S),Image.NEAREST).save('transformer_pixelart.png'); print('ok')
