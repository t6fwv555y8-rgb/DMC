(()=>{
const B=window.BM;
if(!B||!window.Matter)return;
const {Engine,Render,Runner,Bodies,Composite,Events,Sleeping}=Matter;

// Stable Angry-Birds-style structures: pieces begin perfectly supported and asleep.
B.piece=(x,y,w,h,t='bone',ang=0)=>{
  const b=Bodies.rectangle(x,y,w,h,{
    angle:ang,
    label:t,
    friction:.92,
    frictionStatic:1.15,
    frictionAir:.008,
    restitution:.015,
    density:t==='steel'?.0048:.0025,
    sleepThreshold:35,
    render:{visible:false}
  });
  b.hp=t==='steel'?90:t==='flesh'?52:42;
  b.mistVal=t==='steel'?8:t==='flesh'?12:7;
  b.assetKey=B.mat[t][Math.floor(Math.random()*B.mat[t].length)];
  b.drawW=w*1.35;
  b.drawH=h*1.35;
  Composite.add(B.engine.world,b);
  return b;
};

B.core=(x,y,r=24)=>{
  const b=Bodies.circle(x,y,r,{
    label:'core',
    density:.003,
    friction:.8,
    restitution:.03,
    sleepThreshold:35,
    render:{visible:false}
  });
  b.hp=72;
  b.mistVal=36;
  b.assetKey='BM_MachineCore_V1';
  b.drawW=r*2.3;
  b.drawH=r*2.5;
  Composite.add(B.engine.world,b);
  return b;
};

B.build=n=>{
  const floorY=B.H*.76;
  const tx=B.W*.74;
  const primary=n>=8?'flesh':'bone';
  const made=[];
  const p=(...a)=>{const b=B.piece(...a);made.push(b);return b};
  const c=(...a)=>{const b=B.core(...a);made.push(b);return b};

  // Main tower: every load-bearing piece is actually resting on another piece.
  const colH=98, colW=22, roofH=18;
  p(tx-48,floorY-colH/2,colW,colH,primary);
  p(tx+48,floorY-colH/2,colW,colH,'steel');
  p(tx,floorY-colH-roofH/2,118,roofH,primary);

  // Core sits on a real internal shelf instead of hanging from a spring constraint.
  const shelfY=floorY-49;
  p(tx,shelfY,72,12,n>=8?'flesh':'bone');
  c(tx,shelfY-25,18);

  // Upper frame variants. These sit directly on the roof and don't use elastic joints.
  if([2,4,6,9,11].includes(n)){
    const baseTop=floorY-colH-roofH;
    const upperH=62;
    p(tx-28,baseTop-upperH/2,18,upperH,n>=8?'flesh':'bone');
    p(tx+28,baseTop-upperH/2,18,upperH,'steel');
    p(tx,baseTop-upperH-8,76,16,'steel');
  }

  // Side tower variants: grounded independently, so the whole level doesn't unravel at spawn.
  if([5,7,10,12].includes(n)){
    const sx=tx+92;
    const sideH=82;
    p(sx,floorY-sideH/2,20,sideH,n>=8?'flesh':'steel');
    p(sx-24,floorY-sideH/2,18,sideH,'bone');
    p(sx-12,floorY-sideH-8,68,16,n>=8?'flesh':'steel');
    if(n>=10)c(sx-12,floorY-sideH-34,16);
  }

  // Finale adds one more grounded frame rather than a suspended spring assembly.
  if(n===12){
    const lx=tx-100;
    const h=74;
    p(lx,floorY-h/2,20,h,'flesh');
    p(lx+28,floorY-h/2,20,h,'steel');
    p(lx+14,floorY-h-8,64,16,'flesh');
  }

  // Freeze initial micro-jitter. Impact wakes contacted bodies naturally.
  made.forEach(b=>Sleeping.set(b,true));
};

B.setup=()=>{
  if(B.render)Render.stop(B.render);
  if(B.runner)Runner.stop(B.runner);
  if(B.engine)Engine.clear(B.engine);
  B.engine=Engine.create({enableSleeping:true,gravity:{x:0,y:1.0}});
  B.render=Render.create({
    element:B.app,
    engine:B.engine,
    canvas:B.canvas,
    options:{width:B.W,height:B.H,wireframes:false,background:'transparent',pixelRatio:devicePixelRatio||1}
  });
  B.runner=Runner.create();
  Render.run(B.render);
  Runner.run(B.runner,B.engine);
  Composite.add(B.engine.world,Bodies.rectangle(B.W/2,B.H*.76+18,B.W,36,{
    isStatic:true,
    label:'ground',
    friction:1,
    render:{visible:false}
  }));
  B.build(B.level);
  Events.on(B.engine,'collisionStart',B.hit);
  Events.on(B.render,'beforeRender',B.bg);
  Events.on(B.render,'afterRender',B.drawAll);
};
})();