import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 300 }) {
  const mesh = useRef<THREE.Points>(null!)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [count])

  const sizes = useMemo(() => {
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) s[i] = Math.random() * 2 + 0.5
    return s
  }, [count])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    mesh.current.rotation.y = clock.getElapsedTime() * 0.02
    mesh.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.01) * 0.1
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#10b981"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function FloatingOrb({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * speed) * 0.5
    ref.current.position.x = position[0] + Math.cos(clock.getElapsedTime() * speed * 0.7) * 0.3
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[scale, 32, 32]} />
      <meshStandardMaterial color="#10b981" transparent opacity={0.08} emissive="#10b981" emissiveIntensity={0.3} />
    </mesh>
  )
}

export default function ParticleBackground() {
  return (
    <div className="canvas-bg">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#10b981" />
        <Particles count={250} />
        <FloatingOrb position={[-4, 2, -3]} scale={1.2} speed={0.4} />
        <FloatingOrb position={[4, -1, -5]} scale={0.8} speed={0.6} />
        <FloatingOrb position={[0, -3, -4]} scale={1.5} speed={0.3} />
      </Canvas>
    </div>
  )
}
