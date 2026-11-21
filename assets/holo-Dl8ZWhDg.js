import{c as e}from"./cards-wBdFVjWg.js";import{$ as t,Dt as n,Et as r,Lt as i,N as a,Ot as o,Rt as s,Ut as c,c as l,et as u,ht as d,rt as f,tt as p,ut as m}from"./three.module-C2nMVYqm.js";var h=class extends n{constructor(){super(),this.name=`RoomEnvironment`,this.position.y=-3.5;let e=new l;e.deleteAttribute(`uv`);let n=new f({side:1}),r=new f,i=new d(16777215,900,28,2);i.position.set(.418,16.199,.3),this.add(i);let o=new t(e,n);o.position.set(-.757,13.219,.717),o.scale.set(31.713,28.305,28.591),this.add(o);let s=new a(e,r,6),c=new m;c.position.set(-10.906,2.009,1.846),c.rotation.set(0,-.195,0),c.scale.set(2.328,7.905,4.651),c.updateMatrix(),s.setMatrixAt(0,c.matrix),c.position.set(-5.607,-.754,-.758),c.rotation.set(0,.994,0),c.scale.set(1.97,1.534,3.955),c.updateMatrix(),s.setMatrixAt(1,c.matrix),c.position.set(6.167,.857,7.803),c.rotation.set(0,.561,0),c.scale.set(3.927,6.285,3.687),c.updateMatrix(),s.setMatrixAt(2,c.matrix),c.position.set(-2.017,.018,6.124),c.rotation.set(0,.333,0),c.scale.set(2.002,4.566,2.064),c.updateMatrix(),s.setMatrixAt(3,c.matrix),c.position.set(2.291,-.756,-2.621),c.rotation.set(0,-.286,0),c.scale.set(1.546,1.552,1.496),c.updateMatrix(),s.setMatrixAt(4,c.matrix),c.position.set(-2.193,-.369,-5.547),c.rotation.set(0,.516,0),c.scale.set(3.875,3.487,2.986),c.updateMatrix(),s.setMatrixAt(5,c.matrix),this.add(s);let u=new t(e,g(50));u.position.set(-16.116,14.37,8.208),u.scale.set(.1,2.428,2.739),this.add(u);let p=new t(e,g(50));p.position.set(-16.109,18.021,-8.207),p.scale.set(.1,2.425,2.751),this.add(p);let h=new t(e,g(17));h.position.set(14.904,12.198,-1.832),h.scale.set(.15,4.265,6.331),this.add(h);let _=new t(e,g(43));_.position.set(-.462,8.89,14.52),_.scale.set(4.38,5.441,.088),this.add(_);let v=new t(e,g(20));v.position.set(3.235,11.486,-12.541),v.scale.set(2.5,2,.1),this.add(v);let y=new t(e,g(100));y.position.set(0,20,0),y.scale.set(1,.1,1),this.add(y)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function g(e){return new p({color:0,emissive:16777215,emissiveIntensity:e})}var _=`
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,v=`
  precision highp float;
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform float uFoil;      // 0 = plain print, 1 = full holo
  uniform float uTime;
  uniform vec3 uLight;      // light direction (world)
  uniform float uPattern;   // 0 classic, 1 cosmos, 2 sunburst, 3 shatter, 4 rainbow, 5 prism
  uniform float uDim;       // 0..1 darken (unowned ghosts)
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewW;

  vec3 spectrum(float t) { return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + t)); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // rounded-rectangle mask in uv space (card corners)
  float roundMask(vec2 uv) {
    vec2 r = vec2(0.046, 0.033);
    vec2 q = abs(uv - 0.5) - (0.5 - r);
    float d = length(max(q / r, 0.0)) - 1.0;
    return 1.0 - smoothstep(-0.02, 0.02, d);
  }

  void main() {
    float mask = roundMask(vUv);
    if (mask < 0.01) discard;
    vec3 base = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : vec3(0.09, 0.1, 0.14);
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewW);
    float facing = dot(N, V);
    float lum = dot(base, vec3(0.299, 0.587, 0.114));

    // angle-dependent film: hue shifts as the card turns
    float t = facing * 1.6 + (vUv.x * 0.6 + vUv.y * 0.9) + uTime * 0.03;
    vec3 film = spectrum(t);
    float pattern = 1.0;
    if (uPattern > 0.5 && uPattern < 1.5) { // cosmos: star specks
      vec2 g = floor(vUv * vec2(70.0, 98.0));
      pattern = 0.6 + 2.2 * step(0.965, hash(g)) ;
    } else if (uPattern > 1.5 && uPattern < 2.5) { // sunburst
      vec2 c = vUv - 0.5; float a = atan(c.y, c.x);
      pattern = 0.55 + 0.45 * sin(a * 36.0 + facing * 8.0);
      film = mix(film, vec3(1.0, 0.82, 0.42), 0.6);
    } else if (uPattern > 2.5 && uPattern < 3.5) { // shatter
      vec2 g = floor(vUv * vec2(9.0, 12.0) + vec2(sin(vUv.y * 9.0), cos(vUv.x * 7.0)));
      film = spectrum(hash(g) + facing);
    } else if (uPattern > 3.5 && uPattern < 4.5) { // rainbow
      film = spectrum(vUv.y * 1.4 + facing * 2.0);
      pattern = 1.15;
    } else if (uPattern > 4.5) { // prism
      pattern = 0.5 + 0.8 * step(0.5, fract((vUv.x + vUv.y) * 26.0 + facing * 3.0));
    }
    // the foil shows on mid/bright areas, less on deep shadows and black text
    float foilMask = smoothstep(0.12, 0.55, lum) * uFoil;
    vec3 col = base + film * foilMask * 0.2 * pattern;
    col = mix(col, col * film * 1.5, foilMask * 0.1);

    // glare that slides across as the card tilts
    vec3 H = normalize(normalize(uLight) + V);
    float spec = pow(max(dot(N, H), 0.0), 60.0);
    float sweep = smoothstep(0.35, 0.0, abs(fract(vUv.x * 0.7 + vUv.y * 0.5 - facing * 0.8 - uTime * 0.02) - 0.5));
    col += vec3(1.0) * (spec * 0.55 + sweep * 0.06 * (0.3 + uFoil));

    col *= 1.0 - uDim * 0.7;
    // thin bevel highlight on the edge
    float edge = 1.0 - roundMask((vUv - 0.5) * 1.012 + 0.5);
    col += edge * 0.25;
    gl_FragColor = vec4(col, mask);
  }
`,y={classic:0,cosmos:1,sunburst:2,shatter:3,rainbow:4,prism:5,catchitall:1};function b({map:e,foil:t=1,pattern:n=`classic`,dim:r=0}){return new o({vertexShader:_,fragmentShader:v,transparent:!0,uniforms:{uMap:{value:e??null},uHasMap:{value:+!!e},uFoil:{value:t},uTime:{value:0},uLight:{value:new c(.4,.8,1)},uPattern:{value:y[n]??0},uDim:{value:r}}})}async function x(t,n){if(!t)return null;let a=e(t),o=async(e,t)=>{let n=await fetch(e,{mode:`cors`,cache:t});if(!n.ok)throw Error(String(n.status));return createImageBitmap(await n.blob(),{imageOrientation:`flipY`})},s=null,c=`https://wsrv.nl/?url=${encodeURIComponent(a.replace(/^https?:\/\//,``))}&output=webp`;for(let[e,t,n]of[[a,`default`,0],[c,`default`,0],[a,`reload`,500]])try{n&&await new Promise(e=>setTimeout(e,n)),s=await o(e,t);break}catch{}if(!s)return null;let l=new i(s);return l.flipY=!1,l.colorSpace=r,l.anisotropy=Math.min(8,n.capabilities.getMaxAnisotropy()),l.needsUpdate=!0,l}function S(e,t){let n=new u({color:1382442,toneMapped:!1});return new s().loadAsync(e).then(e=>{e.colorSpace=r,e.anisotropy=Math.min(8,t.capabilities.getMaxAnisotropy()),n.map=e,n.color.set(16777215),n.needsUpdate=!0}).catch(()=>{}),n}export{h as i,b as n,x as r,S as t};