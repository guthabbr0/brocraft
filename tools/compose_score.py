#!/usr/bin/env python3
"""Compose and synthesize First Light, Last Stand, an original four-stem score.

No recordings, external samples, generative service, or third-party music is used.
Rebuilding music needs numpy, scipy, soundfile and ffmpeg. Playing/building the
supplied game does not require these tools. All timing is in seconds.
"""
from pathlib import Path
from functools import lru_cache
import json, subprocess
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/audio'
OUT.mkdir(parents=True, exist_ok=True)
SR = 32000
BEAT = .5
BAR = 4 * BEAT
BARS = 64
DURATION = BAR * BARS
N = int(SR * DURATION)
rng = np.random.default_rng(22092026)
stems = {k: np.zeros((N, 2), np.float32) for k in ['horizon','motion','titan','impact']}

def hz(note):
    return 440 * 2 ** ((note - 69) / 12)

def filt(x, freq, kind='lowpass', order=2):
    return sosfilt(butter(order, freq, btype=kind, fs=SR, output='sos'), x).astype(np.float32)

def env(t, attack, release, hold):
    a = np.minimum(1, t / max(.001, attack))
    a = a*a*(3-2*a)
    r = np.clip((hold + release - t) / max(.001, release), 0, 1)
    return a*r*r*(3-2*r)

@lru_cache(maxsize=384)
def instrument(kind, note, duration, variant=0):
    """Detuned additive orchestral/synth voices with finite, smooth envelopes."""
    rr = np.random.default_rng(420 + int(note)*31 + variant*773 + sum(map(ord,kind)))
    release = {'strings':.9,'choir':1.3,'horn':.8,'bow':.14,'piano':2.4,'cello':.2,'sub':.5}[kind]
    t = np.arange(round((duration+release)*SR), dtype=np.float32) / SR
    f = hz(note)
    y = np.zeros_like(t)
    if kind in ('strings','bow','cello'):
        # Several independent players; restricted harmonics avoid digital fizz.
        for voice in range(5 if kind=='strings' else 3):
            detune = 2**(float(rr.uniform(-8,8))/1200)
            vib = .0026*np.sin(2*np.pi*(4.8+voice*.17)*t+voice)*np.minimum(1,t/.45)
            phase = 2*np.pi*f*detune*t + vib*f + float(rr.uniform(0,2*np.pi))
            for h in range(1, min(19,int(13000/f))):
                weight = h**(-1.35) * np.exp(-h*f/(4100 if kind=='strings' else 2500))
                y += np.sin(h*phase+float(rr.uniform(-.14,.14)))*weight/(5 if kind=='strings' else 3)
        if kind=='strings':
            y *= env(t,.48,.9,duration) * (.84+.16*np.sin(np.pi*np.minimum(t/duration,1)))
        else:
            y *= env(t,.016,release,duration)*np.exp(-t/(.19 if kind=='bow' else .38))
        y = filt(y, 5000 if kind=='strings' else 4200)
    elif kind=='choir':
        for voice in range(4):
            phase=2*np.pi*f*2**((voice-1.5)*4/1200)*t + .5*np.sin(2*np.pi*4.7*t+voice)
            for h in range(1,min(36,int(10000/f))):
                hf=h*f
                form=.4*np.exp(-((hf-670)/250)**2)+.22*np.exp(-((hf-1180)/300)**2)+.13*np.exp(-((hf-2500)/500)**2)
                y+=np.sin(h*phase+voice)*(.14/h+form/np.sqrt(h))/4
        y*=env(t,.75,release,duration)
    elif kind=='horn':
        attack=np.minimum(t/.22,1)
        phase=2*np.pi*f*t+.25*np.sin(2*np.pi*4.6*t)*np.minimum(t/.8,1)
        for voice in (-1,1):
            for h in range(1,min(16,int(10000/f))):
                bright=(.28+.72*attack)*np.exp(-h/7)
                y+=np.sin(h*(phase+voice*.0014*f*t)+h*.14)*(bright/h**.8)/2
        y=filt(y,3500)*env(t,.12,release,duration)*(.83+.17*np.sin(np.pi*np.minimum(t/duration,1)))
    elif kind=='piano':
        for h,weight,decay in [(1,1,1.6),(2,.55,1.1),(3,.22,.55),(4,.13,.36),(6,.07,.21)]:
            y+=weight*np.sin(2*np.pi*f*h*np.sqrt(1+.00012*h*h)*t)*np.exp(-t/decay)
        y*=env(t,.006,release,duration)
    elif kind=='sub':
        y=(np.sin(2*np.pi*f*t)+.24*np.sin(2*np.pi*f*2*t)+.08*np.sin(2*np.pi*f*3*t))*env(t,.02,release,duration)*np.exp(-t/2.7)
    return y.astype(np.float32)

@lru_cache(maxsize=64)
def percussion(kind, variant=0):
    rr=np.random.default_rng(11921+variant*451+sum(map(ord,kind)))
    duration={'low':1.9,'mid':.85,'rim':.24,'boom':3.2,'crash':3.5,'shaker':.14,'rise':3.8}[kind]
    t=np.arange(round(SR*duration),dtype=np.float32)/SR
    noise=rr.uniform(-1,1,len(t)).astype(np.float32)
    y=np.zeros_like(t)
    if kind in ('low','mid','boom'):
        f={'low':61,'mid':112,'boom':39}[kind]*(1+(variant%4-.5)*.017)
        decay={'low':.52,'mid':.26,'boom':1.2}[kind]
        phase=2*np.pi*(f*t+f*.8*.032*(1-np.exp(-t/.032)))
        for ratio,g,d in [(1,1,1),(1.47,.38,.55),(2.13,.21,.32),(2.71,.11,.23)]:
            y+=g*np.sin(phase*ratio)*np.exp(-t/(decay*d))
        y+=filt(noise,1300 if kind!='boom' else 500)*.48*np.exp(-t/.035)
        y=np.tanh(y*1.4)*.75*np.minimum(t/.003,1)
    elif kind=='rim':
        y=filt(noise,2400,'highpass')*.4*np.exp(-t/.022)
        y+=(np.sin(2*np.pi*930*t)+.3*np.sin(2*np.pi*1660*t))*.3*np.exp(-t/.035)
    elif kind in ('crash','rise'):
        y=filt(noise,3500,'highpass')
        for f in (2711,3619,4973,6131,7317):
            y+=np.sin(2*np.pi*f*t)*.035
        y=filt(y,11500)
        if kind=='crash':y*=np.exp(-t/.78)*np.minimum(t/.003,1)
        else:y*=np.minimum(t/duration,1)**2*np.minimum((duration-t)/.03,1)
    else:
        y=filt(noise,5900,'highpass')*.5*np.exp(-t/.022)
    return (y*np.minimum((duration-t)/.015,1)).astype(np.float32)

def put(stem, signal, at, gain, pan=0):
    """Wrap tails onto the start, preserving a seamless periodic stem."""
    idx=int(round(at*SR))%N
    sig=signal*gain
    gains=np.array([np.cos((pan+1)*np.pi/4),np.sin((pan+1)*np.pi/4)],np.float32)
    n=min(len(sig),N-idx)
    stems[stem][idx:idx+n]+=sig[:n,None]*gains
    if n<len(sig):stems[stem][:len(sig)-n]+=sig[n:,None]*gains

def note(stem,kind,pitch,start,length,vol,pan=0,variant=0):
    put(stem,instrument(kind,pitch,round(length,3),variant),start,vol,pan)

def drum(kind,start,vol,pan=0,variant=0):
    put('impact',percussion(kind,variant),start,vol,pan)

# D minor, B-flat major, F major, C suspended, D minor, B-flat, G minor, A major.
# Last chord leads back into the loop. Melody, voicing and rhythmic figures are original.
CHORDS=[(38,[62,65,69,76]),(34,[58,62,65,72]),(41,[60,65,69,74]),(36,[60,64,67,74]),
        (38,[62,65,69,72]),(34,[58,62,65,69]),(43,[58,62,67,74]),(33,[57,61,64,71])]
for bar in range(BARS):
    act=bar//16
    within=bar%16
    root, chord=CHORDS[within//2]
    at=bar*BAR
    energy=[.73,.96,.72,1.12][act]*(.86+.14*(within/15))
    if bar%2==0:
        for j,pitch in enumerate(chord):
            note('horizon','strings',pitch,at,3.72,.088*energy,[-.65,-.2,.28,.67][j],act%2)
        for j,pitch in enumerate([root+24,chord[1],chord[2]]):
            note('horizon','choir',pitch,at+.08,3.75,.065*energy,(j-1)*.42,act%2)
        note('horizon','strings',root+12,at,3.8,.085,-.15,act%2)
        # Expressive, low-register brass foundation, not a constant blast.
        for j,pitch in enumerate([root+12,root+19,root+24]):
            note('titan','horn',pitch,at+.025,3.2,.103*energy,(j-1)*.3,act%2)
        note('impact','sub',root-12 if root>=38 else root,at,1.55,.33*energy)
    # A recurring, spacious piano motif with a changed answer in each phrase.
    choices=([2,3,1,2],[3,2,1,0],[2,1,3,2],[3,2,0,1])[act]
    for j,beat in enumerate([0,.75,2,3.25]):
        k=(choices[(within+j)%4]+within//4)%4
        pitch=chord[k]+(12 if (within+j)%5==0 else 0)
        note('horizon','piano',pitch,at+beat*BEAT,.31,.094*(.8+.2*(j==0)),(-1 if j%2 else 1)*.28,act%2)
    # Staccato upper strings, with a second, slower cello voice.
    pattern=[0,2,1,2,0,3,2,1] if within%4<2 else [0,1,2,1,3,2,1,2]
    for j,k in enumerate(pattern):
        pitch=chord[k]+(12 if act==3 and j%3==0 else 0)
        velocity=(1 if j%4==0 else .72 if j%2==0 else .58)*energy
        note('motion','bow',pitch,at+j*.25+(j%2)*.004,.20,.18*velocity,.40 if j%2 else -.40,(j+act)%3)
        if j%2==0:
            note('motion','cello',root+12+(7 if j==6 else 0),at+j*.25,.32,.18*velocity,-.2,j%3)
    # An original slow horn melody. Notes sit in the chord with occasional octave lifts.
    if within%4 in (0,1,2):
        melody=[chord[2],chord[1]+12,chord[3],chord[2]+12][(within+act)%4]
        note('titan','horn',melody,at+.08,1.48,.10*energy,.12,act%2)
    # Large drums, tom answers and restrained high-frequency detail.
    for beat,vel in [(0,1),(1.5,.64),(2.5,.79),(3.5,.53)]:
        drum('low',at+beat*BEAT,.48*vel*energy,(-.18 if beat==1.5 else .12),bar%4)
    for beat,vel in [(1,.74),(2.75,.45),(3,.9)]:
        drum('mid',at+beat*BEAT+.012,.24*vel*energy,.3 if beat==1 else -.35,bar%3)
    for j in range(8):
        drum('shaker',at+j*.25,.055*energy*(1 if j%2 else .7),(-.5 if j%2 else .5),j%4)
    if within%2==1:
        drum('rim',at+1.5,.09*energy,.22,bar%4)
    if within%4==0:
        drum('boom',at,.47*energy,0,act)
        drum('crash',at,.14*energy,.2,act)
    if within in (7,15):
        for j in range(4):drum('mid',at+1.5+j*.125,.13*(1+j*.2)*energy,(j-1.5)*.21,j)
    if within==14:
        drum('rise',at,.19*energy,-.15,act)
    if bar%16==15:print(f'Composed {bar+1}/{BARS} bars',flush=True)

# A compact, original stereo concert-hall impulse; wrap the convolution tails.
for name, track in stems.items():
    wet={'horizon':.30,'motion':.18,'titan':.26,'impact':.17}[name]
    length=int(2.7*SR)
    rt=np.arange(length,dtype=np.float32)/SR
    for channel in range(2):
        ir=rng.normal(0,1,length).astype(np.float32)*np.exp(-rt/ .53)
        ir=filt(ir,4400)
        ir[:int(.027*SR)]=0
        ir/=max(1e-6,float(np.sqrt(np.sum(ir*ir))))
        for delay,amp in [(0.037,.23),(.073,.16),(.119,.12),(.177,.08)]:
            ir[int((delay+channel*.006)*SR)]+=amp
        reflected=fftconvolve(track[:,channel],ir,mode='full').astype(np.float32)
        track[:,channel]+=reflected[:N]*wet
        track[:len(reflected)-N,channel]+=reflected[N:]*wet
    # A high-pass removes DC/subsonic energy before export.
    for channel in range(2):track[:,channel]=filt(track[:,channel],27,'highpass')
    # Shared headroom preserves stem balance when mixed together.
    track *= .74
    wav=OUT/f'{name}.wav'
    sf.write(wav,track,SR,subtype='PCM_16')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libmp3lame','-b:a','112k',
        '-ar',str(SR),'-metadata','title=First Light, Last Stand: '+name,str(OUT/f'{name}.mp3')],check=True)
    wav.unlink()
    print(name,'peak',float(np.max(np.abs(track))),'rms',float(np.sqrt(np.mean(track*track))),flush=True)

# Listening edition: a dramatic four-act arrangement of the same synchronized score.
t=np.arange(N,dtype=np.float32)/SR
curves={
 'horizon': np.ones(N,dtype=np.float32),
 'motion': np.interp(t,[0,8,24,32,56,64,72,88,96,120,128],[.12,.32,.72,.85,1,.22,.32,.75,1,1,.8]),
 'titan': np.interp(t,[0,12,28,32,56,64,72,88,96,120,128],[.18,.30,.65,.78,.92,.15,.3,.7,1,1,.8]),
 'impact': np.interp(t,[0,8,24,32,56,64,72,88,96,120,128],[.3,.42,.7,.95,1,.15,.3,.7,1,1,.85])}
mix=sum(stems[k]*curves[k][:,None] for k in stems)
fade=np.minimum(t/1.5,1)*np.minimum((DURATION-t)/3,1)
mix*=fade[:,None]
# Soft peak handling, followed by ffmpeg's two-stage loudness/true-peak control.
mix=np.tanh(mix*1.4)*.84
wav=OUT/'score-master.wav';sf.write(wav,mix,SR,subtype='PCM_24')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-15:TP=-1.5:LRA=9',
 '-ar','44100','-c:a','libmp3lame','-b:a','192k','-metadata','title=First Light, Last Stand',
 '-metadata','artist=BroCraft Original Score','-metadata','album=BroCraft Epic Audio',
 str(OUT/'First-Light-Last-Stand.mp3')],check=True)
wav.unlink()
manifest={'title':'First Light, Last Stand','durationSeconds':DURATION,'sampleRate':SR,
 'bars':BARS,'beatSeconds':BEAT,'stems':list(stems),'method':'Original additive and modal synthesis; no sampled recordings',
 'peaks':{k:float(np.max(np.abs(v))) for k,v in stems.items()}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Score complete.',flush=True)
