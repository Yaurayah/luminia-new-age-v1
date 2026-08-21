import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const W = 960, H = 540
const level = {
  platforms: [
    {x:0,y:465,w:960,h:75}, {x:115,y:390,w:150,h:22},
    {x:330,y:330,w:150,h:22}, {x:555,y:395,w:145,h:22},
    {x:760,y:315,w:120,h:22}
  ],
  crystals: [{x:185,y:350},{x:400,y:290},{x:610,y:355},{x:815,y:275}],
  coins: [{x:145,y:355},{x:220,y:355},{x:365,y:295},{x:440,y:295},{x:590,y:360},{x:665,y:360},{x:795,y:280},{x:850,y:280}]
}

function App() {
  const canvasRef = useRef(null)
  const keys = useRef({})
  const [score,setScore] = useState(0)
  const [energy,setEnergy] = useState(100)
  const [lives,setLives] = useState(3)
  const [paused,setPaused] = useState(false)
  const [won,setWon] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas.getContext('2d')
    const p = {x:55,y:410,w:30,h:42,vx:0,vy:0,onGround:false}
    let coins = level.coins.map(c=>({...c,got:false}))
    let crystals = level.crystals.map(c=>({...c,got:false}))
    let raf, last=performance.now()

    const down=e=>{keys.current[e.key.toLowerCase()]=true}
    const up=e=>{keys.current[e.key.toLowerCase()]=false}
    window.addEventListener('keydown',down); window.addEventListener('keyup',up)

    function resetPlayer(){
      p.x=55;p.y=410;p.vx=0;p.vy=0
      setLives(v=>Math.max(0,v-1))
    }

    function update(dt){
      if(paused || won || lives<=0) return
      const k=keys.current
      p.vx = (k['arrowright']||k['d'] ? 4.5 : 0) - (k['arrowleft']||k['a'] ? 4.5 : 0)
      if((k['arrowup']||k['w']||k[' ']) && p.onGround){ p.vy=-10.5; p.onGround=false }
      p.vy += 0.48
      p.x += p.vx
      p.y += p.vy
      p.x=Math.max(0,Math.min(W-p.w,p.x))
      p.onGround=false
      for(const q of level.platforms){
        if(p.x+p.w>q.x && p.x<q.x+q.w && p.y+p.h>=q.y && p.y+p.h<=q.y+q.h+12 && p.vy>=0){
          p.y=q.y-p.h;p.vy=0;p.onGround=true
        }
      }
      if(p.y>H+20){ resetPlayer(); return }
      for(const c of coins){
        if(!c.got && Math.hypot(p.x+p.w/2-c.x,p.y+p.h/2-c.y)<28){
          c.got=true; setScore(s=>s+100)
        }
      }
      for(const c of crystals){
        if(!c.got && Math.hypot(p.x+p.w/2-c.x,p.y+p.h/2-c.y)<30){
          c.got=true; setEnergy(e=>Math.min(100,e+20)); setScore(s=>s+250)
        }
      }
      if(p.x>895) setWon(true)
      setEnergy(e=>Math.max(0,e-0.002))
    }

    function draw(t){
      const g=ctx.createLinearGradient(0,0,0,H)
      g.addColorStop(0,'#08051a');g.addColorStop(1,'#191044')
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H)

      // stars
      for(let i=0;i<90;i++){
        const x=(i*137)%W, y=(i*71)%360
        ctx.fillStyle=i%7===0?'#bffaff':'#7665c9'
        ctx.globalAlpha=.55
        ctx.fillRect(x,y,2,2)
      }
      ctx.globalAlpha=1

      // moon
      const mx=700,my=145
      const mg=ctx.createRadialGradient(mx,my,15,mx,my,130)
      mg.addColorStop(0,'#fff4ff');mg.addColorStop(.35,'#d9baff');mg.addColorStop(1,'rgba(122,72,255,0)')
      ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,130,0,Math.PI*2);ctx.fill()
      ctx.strokeStyle='rgba(210,150,255,.45)';ctx.lineWidth=2
      for(let r=55;r<125;r+=25){ctx.beginPath();ctx.arc(mx,my,r,0,Math.PI*2);ctx.stroke()}

      // mountains
      ctx.fillStyle='#110b31'
      ctx.beginPath();ctx.moveTo(0,400);ctx.lineTo(150,280);ctx.lineTo(280,400);ctx.lineTo(430,250);ctx.lineTo(590,400);ctx.lineTo(760,260);ctx.lineTo(960,400);ctx.lineTo(960,540);ctx.lineTo(0,540);ctx.fill()

      // platforms
      for(const q of level.platforms){
        ctx.fillStyle='#17182b';ctx.fillRect(q.x,q.y,q.w,q.h)
        ctx.fillStyle='#55f5ce';ctx.fillRect(q.x,q.y,q.w,4)
        ctx.fillStyle='rgba(120,80,255,.35)';ctx.fillRect(q.x,q.y+4,q.w,q.h-4)
      }

      // portal
      ctx.strokeStyle='#68eaff';ctx.lineWidth=8
      ctx.shadowBlur=22;ctx.shadowColor='#48ddff'
      ctx.beginPath();ctx.arc(920,405,35,Math.PI,0);ctx.stroke()
      ctx.shadowBlur=0
      ctx.fillStyle='#bdf8ff';ctx.font='18px system-ui';ctx.fillText('PORTAIL',885,460)

      // collectibles
      for(const c of coins) if(!c.got){
        ctx.fillStyle='#ffd45a';ctx.shadowBlur=14;ctx.shadowColor='#ffb000'
        ctx.beginPath();ctx.arc(c.x,c.y,9+Math.sin(t/180+c.x)*2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
      }
      for(const c of crystals) if(!c.got){
        ctx.fillStyle='#a8ffff';ctx.shadowBlur=20;ctx.shadowColor='#50eaff'
        ctx.beginPath();ctx.moveTo(c.x,c.y-16);ctx.lineTo(c.x+11,c.y);ctx.lineTo(c.x,c.y+16);ctx.lineTo(c.x-11,c.y);ctx.closePath();ctx.fill();ctx.shadowBlur=0
      }

      // player aura
      const ag=ctx.createRadialGradient(p.x+15,p.y+20,2,p.x+15,p.y+20,40)
      ag.addColorStop(0,'rgba(120,255,245,.7)');ag.addColorStop(1,'rgba(120,255,245,0)')
      ctx.fillStyle=ag;ctx.beginPath();ctx.arc(p.x+15,p.y+20,40,0,Math.PI*2);ctx.fill()
      ctx.fillStyle='#f4ecff';ctx.fillRect(p.x,p.y+12,p.w,p.h-12)
      ctx.fillStyle='#11152c';ctx.beginPath();ctx.arc(p.x+15,p.y+11,15,0,Math.PI*2);ctx.fill()
      ctx.fillStyle='#62f6ff';ctx.beginPath();ctx.arc(p.x+10,p.y+10,3,0,Math.PI*2);ctx.arc(p.x+20,p.y+10,3,0,Math.PI*2);ctx.fill()

      if(paused || won || lives<=0){
        ctx.fillStyle='rgba(4,2,15,.72)';ctx.fillRect(0,0,W,H)
        ctx.textAlign='center';ctx.fillStyle='#fff'
        ctx.font='bold 42px system-ui';ctx.fillText(won?'NIVEAU ACCOMPLI':lives<=0?'ÉNERGIE ÉPUISÉE':'PAUSE',W/2,240)
        ctx.font='20px system-ui';ctx.fillStyle='#cfc8ff'
        ctx.fillText(won?`Score : ${score}`:'Appuie sur le bouton pour continuer',W/2,280)
        ctx.textAlign='left'
      }
    }

    function loop(now){
      const dt=Math.min(32,now-last);last=now
      update(dt);draw(now);raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop)
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)}
  },[paused,won,lives,score])

  const hold = key => {
    keys.current[key]=true
    setTimeout(()=>keys.current[key]=false,140)
  }

  const restart=()=>{location.reload()}

  return <main className="app">
    <header>
      <div className="brand"><span className="lotus">✦</span><div><h1>LUMINIA</h1><small>NEW AGE • MINI GAME</small></div></div>
      <div className="stats"><span>❤️ {lives}</span><span>⚡ {Math.round(energy)}%</span><span>🪙 {score}</span><button onClick={()=>setPaused(v=>!v)}>Ⅱ</button></div>
    </header>
    <section className="game-wrap">
      <canvas ref={canvasRef} width={W} height={H}/>
      <div className="hint">← → / A D : courir &nbsp; • &nbsp; ↑ / W / ESPACE : sauter &nbsp; • &nbsp; atteindre le portail</div>
    </section>
    <nav className="controls">
      <button onPointerDown={()=>hold('arrowleft')}>◀</button>
      <button onPointerDown={()=>hold('arrowright')}>▶</button>
      <button className="jump" onPointerDown={()=>hold('arrowup')}>↑</button>
      <button className="pause" onClick={()=>setPaused(v=>!v)}>{paused?'▶':'Ⅱ'}</button>
      <button className="restart" onClick={restart}>↻</button>
    </nav>
    <footer><span>React + Vite</span><span>Prototype jouable • sauvegarde à venir</span></footer>
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
