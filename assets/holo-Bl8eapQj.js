import{c as e}from"./cards-COgGh7tO.js";import{$ as t,Et as n,Lt as r,O as i,Ot as a,Rt as o,Ut as s,et as c,mt as l}from"./three.module-C2nMVYqm.js";var u=`
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
`,d=`
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
`,f={classic:0,cosmos:1,sunburst:2,shatter:3,rainbow:4,prism:5,catchitall:1};function p({map:e,foil:t=1,pattern:n=`classic`,dim:r=0}){return new a({vertexShader:u,fragmentShader:d,transparent:!0,uniforms:{uMap:{value:e??null},uHasMap:{value:+!!e},uFoil:{value:t},uTime:{value:0},uLight:{value:new s(.4,.8,1)},uPattern:{value:f[n]??0},uDim:{value:r}}})}async function m(t,i){if(!t)return null;let a=e(t),o=async(e,t)=>{let n=await fetch(e,{mode:`cors`,cache:t});if(!n.ok)throw Error(String(n.status));return createImageBitmap(await n.blob(),{imageOrientation:`flipY`})},s=null,c=`https://wsrv.nl/?url=${encodeURIComponent(a.replace(/^https?:\/\//,``))}&output=webp`;for(let[e,t,n]of[[a,`default`,0],[c,`default`,0],[a,`reload`,500]])try{n&&await new Promise(e=>setTimeout(e,n)),s=await o(e,t);break}catch{}if(!s)return null;let l=new r(s);return l.flipY=!1,l.colorSpace=n,l.anisotropy=Math.min(8,i.capabilities.getMaxAnisotropy()),l.needsUpdate=!0,l}function h(e,t){let r=new c({color:1382442,toneMapped:!1});return new o().loadAsync(e).then(e=>{e.colorSpace=n,e.anisotropy=Math.min(8,t.capabilities.getMaxAnisotropy()),r.map=e,r.color.set(16777215),r.needsUpdate=!0}).catch(()=>{}),r}function g(e,n){let r=.63,a=.88,o=new i,s=new t(new l(r,a,1,1),e);o.add(s);let u=new t(new l(r,a),n??new c({color:1382442}));return u.rotation.y=Math.PI,u.position.z=-.003,o.add(u),o}export{m as i,g as n,p as r,h as t};