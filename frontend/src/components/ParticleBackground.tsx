import { useMemo, useCallback } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine, ISourceOptions } from '@tsparticles/engine'

// İstanbul gece ışıkları / Boğaz'ın sıcak tonları — önceki jenerik yeşil
// "SaaS parçacık" efeği yerine, RealIstanbulMap ile aynı sıcak dile uysun diye.
const WARM_COLORS = ['#f5c542', '#f0a04b', '#e8874a', '#ffd873']

// ParticlesProvider'ın init callback'i uygulama ömrü boyunca referans olarak
// sabit kalmalı (aksi halde provider hata fırlatıyor) — bileşen dışında tanımlı.
async function initEngine(engine: Engine) {
  await loadSlim(engine)
}

function WarmParticles({ reduceMotion }: { reduceMotion: boolean }) {
  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches

  const options: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 60,
      fullScreen: { enable: false },
      background: { color: 'transparent' },
      particles: {
        number: { value: isMobile ? 22 : 42 },
        color: { value: WARM_COLORS },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.18, max: 0.45 },
          animation: reduceMotion ? { enable: false } : { enable: true, speed: 0.4, sync: false },
        },
        size: {
          value: { min: 1, max: isMobile ? 5 : 9 },
        },
        blur: { enable: true },
        move: {
          // prefers-reduced-motion: noktalar sabit kalır ama görünür olmaya devam eder
          // (önceki soluk statik gradient neredeyse görünmezdi).
          enable: !reduceMotion,
          speed: 0.35,
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'out' },
        },
        links: { enable: false },
      },
      detectRetina: true,
    }),
    [isMobile, reduceMotion],
  )

  const particlesLoaded = useCallback(async () => {}, [])

  return (
    <div className="canvas-bg canvas-bg-warm-wrap">
      <Particles id="tsparticles-warm-bg" options={options} particlesLoaded={particlesLoaded} />
    </div>
  )
}

export default function ParticleBackground() {
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <ParticlesProvider init={initEngine}>
      <WarmParticles reduceMotion={reduceMotion} />
    </ParticlesProvider>
  )
}
