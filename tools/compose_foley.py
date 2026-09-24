#!/usr/bin/env python3
"""Original BroCraft foley and creature voices, synthesized without third-party samples.
Authoring only: numpy, scipy, soundfile and ffmpeg. Playback has no dependencies.
All times are in seconds, frequencies in hertz, amplitudes dimensionless.
"""
from pathlib import Path
import json, subprocess
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, iirpeak, lfilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/audio'
SR = 32000
rng = np.random.default_rng(20260923)
clips = {}

def time(d): return np.arange(round(d*SR))/SR

def low(x, hz): return sosfilt(butter(2, min(hz, SR*.46), fs=SR, output='sos'), x)

def band(x, hz, q=2):
    b, a = iirpeak(min(hz, SR*.46), q, fs=SR)
    return lfilter(b, a, x)

def noise(t, hz=5000): return low(rng.normal(0, 1, len(t)), hz)

def env(t, d, attack=.006, power=1):
    return np.minimum(1, t/max(.001,attack)) * np.maximum(0, 1-t/d)**power

def modes(t, frequencies, decay=.08, gains=None):
    gains = gains or [1/(i+1)**.7 for i in range(len(frequencies))]
    return sum(g*np.sin(2*np.pi*f*t+rng.uniform(-.1,.1))*np.exp(-t/(decay*(1+.22*i))) for i,(f,g) in enumerate(zip(frequencies,gains)))

def add(key, x, peak=.65):
    x=np.asarray(x, dtype=np.float64)
    x = sosfilt(butter(2, 35, fs=SR, btype='highpass', output='sos'),x)
    fade=min(int(.006*SR),len(x)//3)
    x[:fade]*=np.linspace(0,1,fade); x[-fade:]*=np.linspace(1,0,fade)
    x=np.tanh(x*1.12)
    x*=peak/max(.001,np.max(np.abs(x)))
    assert np.isfinite(x).all(), key
    clips[key]=x.astype(np.float32)

MATERIALS=['stone','wood','dirt','grass','sand','gravel','glass','snow','ice','leaves','wool','metal','crystal','water']

def impact(material, action, variant):
    d={'step':.24,'mine':.20,'break':.65,'place':.28}[action]
    if material in ['glass','ice','crystal'] and action=='break': d=.93
    if material=='water': d=.48 if action!='break' else .76
    t=time(d); x=np.zeros(len(t)); pitch=rng.uniform(.88,1.13)
    body= {'stone':.15,'wood':.24,'dirt':.14,'grass':.13,'sand':.06,'gravel':.1,'glass':.02,'snow':.09,'ice':.1,'leaves':.035,'wool':.13,'metal':.10,'crystal':.05,'water':.02}[material]
    x+=body*modes(t,[100*pitch,173*pitch],.028 if action=='mine' else .047)
    if material=='wood':
        x+=.24*modes(t,[155*pitch,370*pitch,745*pitch,1400*pitch],.025)
        x+=noise(t,2400)*.26*np.exp(-t/.032)
    elif material in ['stone','gravel']:
        x+=noise(t,4800)*.32*np.exp(-t/.034)
        x+=.14*modes(t,[410*pitch,1140*pitch,2830*pitch],.023)
    elif material in ['dirt','grass','sand','leaves','snow','wool']:
        cut={'dirt':1550,'grass':4400,'sand':6500,'leaves':6800,'snow':3300,'wool':600}[material]
        x+=noise(t,cut)*(.22 if material!='wool' else .35)*np.exp(-t/(.054 if action!='mine' else .029))
        if material in ['grass','leaves']:
            x+=band(noise(t,9000),3700,1.5)*.15*env(t,d,.015,3)
        if material=='snow':
            x+=.06*band(noise(t),1200,5)*np.exp(-((t-.05)/.045)**2)
    elif material in ['glass','ice','crystal','metal']:
        f={'glass':[1870,2741,3613,5490],'ice':[710,1210,2080,3390],'crystal':[810,1216,2030,3243],'metal':[620,1667,3211,4768]}[material]
        x+=.21*modes(t,[v*pitch for v in f],.065 if action!='break' else .11)
        x+=noise(t,8000)*.17*np.exp(-t/.015)
    elif material=='water':
        x+=noise(t,3300)*.30*env(t,d,.012,2)
        for j in range(8):
            at=rng.uniform(.02,d*.75); q=t-at; ix=q>=0; f=rng.uniform(290,1700)
            x[ix]+=.07*np.sin(2*np.pi*f*(q[ix]+q[ix]**2*2))*np.exp(-q[ix]/.02)
    # Multiple separately timed fragments, not one repeated noise burst.
    count={'step':5,'mine':2,'break':22,'place':4}[action]
    if material in ['wool','water']: count=1
    for j in range(count):
        at=rng.uniform(.016,d*.68); start=int(at*SR); tt=t[:len(t)-start]
        amp=rng.uniform(.025,.10)*(1-at/d)
        if material in ['glass','ice','metal','crystal','gravel','stone']:
            base=rng.uniform(1400,6800) if material!='stone' else rng.uniform(700,2400)
            grain=modes(tt,[base,base*1.53],rng.uniform(.004,.024))
        else:
            grain=noise(tt,4500 if material not in ['dirt','wool'] else 900)*np.exp(-tt/rng.uniform(.003,.012))
        x[start:]+=grain*amp
    if action=='place': x*=np.exp(-t/.11)
    return x

for material in MATERIALS:
    for action in ['step','mine','break','place']:
        for v in range(4):
            add(f'{action}/{material}/{v}',impact(material,action,v),{'step':.46,'mine':.62,'break':.77,'place':.61}[action])

# Tool-head overlays articulate both material tier and tool geometry.
for tool in ['pick','axe','shovel','sword','hand']:
    for tier in range(1,5):
        for v in range(3):
            t=time(.30); p=rng.uniform(.93,1.08)
            base=[170,460,1100,1720][tier-1]*p
            x=.18*modes(t,[base,base*2.27,base*4.15],.019+tier*.007)
            if tool=='axe': x+=.27*modes(t,[110*p,240*p,570*p],.028)
            if tool=='shovel': x+=noise(t,2800)*.23*np.exp(-t/.055)
            if tool=='sword': x+=band(noise(t,7500),2400,1)*.4*np.exp(-((t-.06)/.047)**2)
            if tool=='hand': x=.3*modes(t,[93*p,164*p],.028)+noise(t,900)*.12*np.exp(-t/.016)
            add(f'tool/{tool}/{tier}/{v}',x,.55)

# Source-filter animal phonation: glottal harmonics, changing vowels, breath,
# independent pitch gestures and species-specific syllabic envelopes.
def vocal(species, state, variation):
    d={'sheep':1.12,'ox':1.65,'snout':.84,'peep':.78,'husk':1.35,'bone':.75,'crawler':.84,'fuse':1.04}[species]
    if state=='hurt':d*=.53
    if state=='death':d*=.72
    d*=rng.uniform(.88,1.10);t=time(d);u=t/d
    if species=='bone':
        x=np.zeros(len(t))
        for j in range(8):
            at=int(rng.uniform(0,d*.65)*SR); tt=t[:len(t)-at]
            x[at:]+=.14*modes(tt,[rng.uniform(450,800),rng.uniform(1200,1900),rng.uniform(2200,3100)],.028)
        return x
    if species in ['crawler','fuse']:
        x=band(noise(t,9000),3300 if species=='fuse' else 2150,1.2)*env(t,d,.07,1.3)
        x*=.5+.5*np.sin(2*np.pi*(23 if species=='crawler' else 13)*t)**2
        if species=='crawler':x+=.2*modes(t,[165,327,690],.12)
        return x
    if species=='peep':
        x=np.zeros(len(t))
        for j in range(3 if state=='idle' else 5):
            at=int((.035+j*d/(3 if state=='idle' else 5))*SR)
            tt=t[:max(0,len(t)-at)];f=rng.uniform(580,900)*(1.5 if state=='hurt' else 1)
            phase=2*np.pi*(f*tt-f*1.6*tt**2)
            x[at:]+=(np.sin(phase)+.35*np.sin(phase*2)+.12*noise(tt,3500))*np.exp(-tt/.046)*np.minimum(1,tt/.003)
        return x*env(t,d,.002,.4)
    f0={'sheep':188,'ox':86,'snout':116,'husk':68}[species]*rng.uniform(.91,1.11)
    if state=='hurt':f0*=1.5
    if state=='death':f0*=.88
    contour=np.interp(u,[0,.08,.25,.6,.84,1],[.78,1.05,1.13,1,.83,.65])
    trem={'sheep':13.8,'ox':4.1,'snout':27,'husk':6.1}[species]
    pitch=f0*contour*(1+.023*np.sin(2*np.pi*trem*t)+.003*noise(t,12))
    phase=2*np.pi*np.cumsum(pitch)/SR
    source=sum(np.sin(phase*k+.12*k)/(k**1.20) for k in range(1,38))
    source+=noise(t,5000)*(.09 if species!='husk' else .3)
    formants={'sheep':([670,1320,2550],[880,1710,2800]),'ox':([260,530,1650],[460,960,2160]),'snout':([390,1010,2380],[640,1510,2970]),'husk':([290,730,1920],[430,1120,2590])}[species]
    def vowel(freqs):return sum(band(source,f,4+i)*gain for i,(f,gain) in enumerate(zip(freqs,[1.9,1.35,.7])))
    opening=np.sin(np.pi*u)**1.2
    x=vowel(formants[0])*(1-opening)+vowel(formants[1])*opening
    x+=.10*np.sin(phase)
    if species=='sheep':
        gate=.68+.32*np.sin(2*np.pi*trem*t+np.sin(2*np.pi*1.8*t))
        x*=gate*(.18+.82*np.sin(np.pi*u)**.50)
    elif species=='ox': x*=.92+.08*np.sin(2*np.pi*4.5*t)
    elif species=='snout': x*=(np.exp(-((u-.20)/.13)**4)+.75*np.exp(-((u-.65)/.18)**4))*(.65+.35*np.sin(2*np.pi*24*t))
    elif species=='husk': x=np.tanh(x*2)*(.65+.35*np.sin(phase*.49))
    x+=noise(t,1800)*.012*opening
    return x*env(t,d,.055 if state=='idle' else .012,.55)

for species in ['sheep','ox','snout','peep','husk','bone','crawler','fuse']:
    for state,num in [('idle',4),('hurt',2),('death',2)]:
        for v in range(num): add(f'voice/{species}/{state}/{v}',vocal(species,state,v),.70 if state=='idle' else .8)

# Environmental and interactive accents.
for name in ['drip','bird','cricket','fire','bubble','chest-open','chest-close','cloth','land','tool-break','swish']:
    for v in range(3):
        d={'bird':1.25,'cricket':1.4,'fire':.85,'drip':.8,'bubble':.55,'chest-open':.65,'chest-close':.38,'cloth':.4,'land':.34,'tool-break':.65,'swish':.22}[name]
        t=time(d);x=np.zeros(len(t))
        if name in ['drip','bubble','bird']:
            for j in range(4 if name=='bird' else 2):
                at=int((.02+j*d/(5 if name=='bird' else 3))*SR); tt=t[:len(t)-at]
                f=rng.uniform(2000,3600) if name=='bird' else rng.uniform(700,1500)
                q=2*np.pi*f*(tt+.35*np.sin(2*np.pi*3*tt)/(2*np.pi*3))
                x[at:]+=(np.sin(q)+.14*np.sin(2*q))*np.exp(-tt/(.06 if name=='bird' else .025))*np.minimum(1,tt/.004)
        elif name=='cricket':
            x=(np.sin(2*np.pi*4300*t)+.25*np.sin(2*np.pi*8200*t))*(np.sin(2*np.pi*23*t)>.4)*(.5+.5*np.sin(2*np.pi*3.1*t))**6*env(t,d,.04,1)
        elif name=='fire':
            x=noise(t,600)*.3*env(t,d,.04,2)
            for j in range(13):
                at=int(rng.uniform(0,d*.8)*SR);tt=t[:len(t)-at]
                x[at:]+=.15*noise(tt,6300)*np.exp(-tt/rng.uniform(.003,.012))
        elif name in ['chest-open','chest-close']:
            x=modes(t,[130,330,800],.02)*.25+noise(t,1500)*np.exp(-t/.02)*.1
            if name=='chest-open':x+=.2*np.sin(2*np.pi*(330*t+80*t*t))*(.6+.4*np.sin(2*np.pi*31*t))*env(t,d,.1,1.8)
        elif name=='cloth':x=noise(t,1700)*env(t,d,.055,2)
        elif name=='land':x=modes(t,[68,112,180],.06)*.6+noise(t,1800)*np.exp(-t/.05)*.35
        elif name=='tool-break':x=modes(t,[650,1500,3310],.07)*.3+noise(t,7500)*env(t,d,.002,5)
        elif name=='swish':x=band(noise(t,7500),2300,1)*env(t,d,.05,1.5)
        add(f'event/{name}/{v}',x,.57 if name not in ['land','tool-break'] else .7)

# A smooth loop texture; end-to-start crossfade removes the seam.
for name,cut in [('wind',450),('water',2700),('cave',180),('night',1100)]:
    t=time(8);x=noise(t,cut)
    x*=.6+.2*np.sin(2*np.pi*t/8)+.13*np.cos(2*np.pi*t/4)
    if name=='water':x+=.13*band(noise(t,8000),1800,1.5)
    k=int(.3*SR);a=np.linspace(0,1,k)
    seam=x[:k]*a+x[-k:]*(1-a)
    x=np.concatenate([seam,x[k:-k]])
    # Do not edge-fade the loop. Both edges meet at a near-identical waveform.
    x=x.astype(np.float32);x*=.38/max(np.max(abs(x)),.001);clips[f'loop/{name}']=x

OUT.mkdir(parents=True,exist_ok=True)
sprite=[];manifest={};cursor=0;pad=np.zeros(int(.055*SR),dtype=np.float32)
for key,x in clips.items():
    sprite.append(pad);cursor+=len(pad)
    manifest[key]={'offset':round(cursor/SR,6),'duration':round(len(x)/SR,6)}
    sprite.append(x);cursor+=len(x)
sprite.append(pad)
combined=np.concatenate(sprite)
tmp=OUT/'living-world.wav';sf.write(tmp,combined,SR,subtype='PCM_16')
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(tmp),'-c:a','libmp3lame','-b:a','128k',str(OUT/'living-world.mp3')],check=True)
(OUT/'living-world.json').write_text(json.dumps({'version':1,'sampleRate':SR,'duration':len(combined)/SR,'clips':manifest},indent=2)+'\n')
tmp.unlink()
# An honest unprocessed sampler of the exact soundbank, not a separate mock-up.
demo=[]
for key in ['voice/sheep/idle/0','voice/ox/idle/0','voice/snout/idle/0','voice/peep/idle/0','mine/stone/0','tool/pick/3/0','break/stone/0','mine/wood/0','break/wood/0','step/gravel/0','step/snow/0','break/glass/0','break/crystal/0','voice/bone/idle/0','voice/husk/idle/0','event/chest-open/0','event/fire/0','event/drip/0']:
    demo.extend([clips[key],np.zeros(int(.32*SR))])
sf.write(OUT/'soundcheck.wav',np.concatenate(demo),SR)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(OUT/'soundcheck.wav'),'-c:a','libmp3lame','-b:a','160k',str(OUT/'Living-World-Soundcheck.mp3')],check=True)
(OUT/'soundcheck.wav').unlink()
print(json.dumps({'clips':len(clips),'duration':len(combined)/SR,'mp3Bytes':(OUT/'living-world.mp3').stat().st_size},indent=2))
